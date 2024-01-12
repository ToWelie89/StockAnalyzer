const puppeteer = require("puppeteer");
require('dotenv').config();

const { sendMail } = require('./mailer.js');
const { delay, printTable, round } = require('./helpers.js');
const { stocks } = require('./stocks.js');

const currencies = {};

const getHistory = async stock => {
  const id = (stock.avanzaUrl.match(/[0-9]{5,7}/g) && stock.avanzaUrl.match(/[0-9]{5,7}/g).length === 1) ? stock.avanzaUrl.match(/[0-9]{5,7}/g)[0] : null;
  if (id) {
    const res = await fetch(`https://www.avanza.se/_api/price-chart/marketmaker/${id}?timePeriod=one_year`, { method: 'GET' });
    const data = await res.json();
    return data;
  } else {
    return null;
  }
}

const lookUpCurrency = async (page, currency) => {
  await page.goto(`https://www.google.com/search?q=1+${currency}+to+sek`, {
    timeout: 20000,
    waitUntil: "networkidle2",
  });
  await delay(process.env.NODE_ENV === 'production' ? 2000 : 500);
  await page.waitForSelector("#result-stats");
  const elements = await page.$$("div[data-name] input[aria-label]");
  if (elements && elements[1]) {
      let currentValue = await elements[1].evaluate(x => x.value);
      currentValue = Number(currentValue);
      if (currentValue) {
        currencies[currency] = currentValue;
      }
  }
  return;
}

const startScraping = async () => {
  let result = [];
  let browser;
  let page;
  
  try {
    console.log(111, process.env.NODE_ENV)
    browser = await puppeteer.launch({
      pipe: true,
      headless: true,
      timeout: 10000,
      defaultViewport: null,
      args: [
        "--lang=\"sv-SE\"",
        "--disable-setuid-sandbox",
        /* "--no-sandbox",
        "--single-process",
        "--no-zygote", */
      ],
      env: { LANGUAGE: "sv-SE" },
      executablePath:
        process.env.NODE_ENV === "production"
          ? process.env.PUPPETEER_EXECUTABLE_PATH
          : puppeteer.executablePath()
    });
    page = await browser.newPage({ timeout: 8000 });

    await lookUpCurrency(page, 'USD');
    await lookUpCurrency(page, 'EUR');
    console.log(currencies);

    for (let i = 0; i < stocks.length; i++) {
      console.log(`Scraping data for stock number ${i + 1}`);
      const stock = stocks[i];
      if (stock.avanzaUrl) {
        const history = await getHistory(stock);
        await page.goto(stock.avanzaUrl, {
          timeout: 20000,
          waitUntil: "networkidle2",
        });
        await delay(process.env.NODE_ENV === 'production' ? 2000 : 300);
        await page.waitForSelector(".app-container");
  
        const values = [];
        for (let j = 0; j < 9; j++) {
          let value;
          try {
            value = await page.$eval(
              `aza-period-button:nth-child(${j + 1})`,
              (element) => {
                return element ? element.textContent : undefined;
              }
            );
            if (value) {
              value = value.match(/(?:−)?[0-9]{1,5},[0-9]{2,2}/g)[0];
              value = value.replace('−', '-');
              value = value.replace(',', '.');
              value = Number(value);
              values.push(value);
            }
          } catch (e) {
            console.warn(`Could not find selector aza-period-button:nth-child(${j + 1}) for stock number ${i + 1}.`);
          }
        }
        const name = await page.$eval(
          'header h1',
          (element) => element.textContent
        );
        let currentValue = await page.$eval(
          'aza-quote span[data-e2e="tbs-quote-latest-value"]',
          (element) => element.textContent
        );
  
        let currency;
        if (currentValue.includes('SEK')) currency = 'SEK';
        if (currentValue.includes('USD')) currency = 'USD';
  
        currentValue = currentValue.trim();
        currentValue = currentValue.replaceAll(/\s/g, '');
        currentValue = currentValue.replaceAll(/SEK/g, '');
        currentValue = currentValue.replaceAll(/USD/g, '');
        currentValue = currentValue.replace(',', '.');
        currentValue = Number(currentValue);
  
        const item = {
          name,
          oneDayChange: values[0],
          oneWeekChange: values[1],
          oneMonthChange: values[2],
          threeMonthsChange: values[3],
          thisYearChange: values[4],
          oneYearChange: values[5],
          threeYearsChange: values[6],
          fiveYearsChange: values[7],
          allTimeChange: values[8],
          currentValue,
          currency
        };
  
        if (stock.transactionCosts && stock.transactionCosts.length > 0) {
          const totalMoneySpent = stock.transactionCosts.reduce((t, c) => {
            t += (c.cost * c.amount);
            return t;
          }, 0);
          const totalCurrentWorth = stock.transactionCosts.reduce((t,c) => t += c.amount, 0) * currentValue;
          item.totalMoneySpent = totalMoneySpent;
          item.totalCurrentWorth = totalCurrentWorth;
  
          item.profitEarnedSEK = round(totalCurrentWorth - totalMoneySpent, 2);
  
          const percentageDiff = totalCurrentWorth / totalMoneySpent;
          let diffPercent;
  
          if (percentageDiff > 1) {
            diffPercent = (percentageDiff - 1) * 100;
          } else {
            diffPercent = ((1 - percentageDiff) * 100) * -1;
          }
          diffPercent = round(diffPercent, 2);
          item.diffPercent = diffPercent;
        }
  
        item.ownsStock = stock.transactionCosts && stock.transactionCosts.length > 0;
        item.amount = stock.transactionCosts ? stock.transactionCosts.reduce((t,c) => t += c.amount, 0) : 0;

        // look up currency on google
        if (item.ownsStock && item.currency !== 'SEK') {
          if (currencies[item.currency]) {
            item.totalCurrentWorthInSEK = round(item.totalCurrentWorth * currencies[item.currency]);
          } else {
            await page.goto(`https://www.google.se/search?q=${item.totalCurrentWorth}+${currency}+to+SEK`, {
              timeout: 20000,
              waitUntil: "networkidle2",
            });
            await delay(process.env.NODE_ENV === 'production' ? 2000 : 500);
            await page.waitForSelector("#result-stats");
            const elements = await page.$$("div[data-name] input[aria-label]");
            if (elements && elements[1]) {
                let currentValue = await elements[1].evaluate(x => x.value);
                currentValue = Number(currentValue);
                if (currentValue) {
                    item.totalCurrentWorthInSEK = currentValue;
                }
            }
          }
        }
        result.push(item);
      } else if (stock.cryptoCoin) {
        await page.goto(`https://www.google.com/search?q=${stock.amountOwned}+${stock.name}+to+${stock.currency}`, {
          timeout: 20000,
          waitUntil: "networkidle2",
        });
        await delay(process.env.NODE_ENV === 'production' ? 2000 : 500);
        await page.waitForSelector("#result-stats");

        const elements = await page.$$("div[data-name] input[aria-label]");
        if (elements && elements[1]) {
          let currentValue = await elements[1].evaluate(x => x.value);
          currentValue = Number(currentValue);
          if (currentValue) {
            result.push({
              cryptoCoin: true,
              currentTotalValue: currentValue,
              name: stock.name,
              currency: stock.currency,
              amountOwned: stock.amountOwned
            });
          }
        }
      }
    }
    //console.log(result);
  } catch (e) {
    console.error(e);
  } finally {
    await delay(process.env.NODE_ENV === 'production' ? 2000 : 300);
    await browser.close();
    await printTable(result);
    if (process.env.MAIL_ADDRESS && process.env.MAIL_PASSWORD) {
      await sendMail(result);
    } else {
      console.log('No email configured, skipping mail report');
    }
  }
}

// Main function
const run = async () => {
  console.log(`Starting scraping script...`);
  await startScraping();
}

module.exports = {
  run
}