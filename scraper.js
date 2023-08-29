const puppeteer = require("puppeteer");

const { sendMail } = require('./mailer.js');
const { delay } = require('./helpers.js');

const stocksToCheck = [
  {
    avanzaUrl: 'https://www.avanza.se/borshandlade-produkter/certifikat-torg/om-certifikatet.html/563966/bitcoin-xbt',
    transactionCosts: [
      1296.49
    ]
  }, {
    avanzaUrl: 'https://www.avanza.se/aktier/om-aktien.html/399875/microstrategy-a'
  }, {
    avanzaUrl: 'https://www.avanza.se/aktier/om-aktien.html/794954/riot-platforms'
  }, {
    avanzaUrl: 'https://www.avanza.se/aktier/om-aktien.html/804473/marathon-digital'
  }, {
    avanzaUrl: 'https://www.avanza.se/aktier/om-aktien.html/1300923/bitfarms'
  }, {
    avanzaUrl: 'https://www.avanza.se/aktier/om-aktien.html/1247224/hut-8-mining'
  }, {
    avanzaUrl: 'https://www.avanza.se/aktier/om-aktien.html/3323/apple'
  }, {
    avanzaUrl: 'https://www.avanza.se/aktier/om-aktien.html/3873/microsoft'
  }, {
    avanzaUrl: 'https://www.avanza.se/aktier/om-aktien.html/4478/nvidia'
  }, {
    avanzaUrl: 'https://www.avanza.se/aktier/om-aktien.html/238449/tesla'
  }, {
    avanzaUrl: 'https://www.avanza.se/aktier/om-aktien.html/5364/hennes---mauritz-b'
  }
];

const round = (number, numberOfDecimals) => {
  number = number * Math.pow(10, numberOfDecimals);
  number = Math.round(number);
  number = number / Math.pow(10, numberOfDecimals);
  return number;
}

async function startScraping() {
  let result = [];

  const browser = await puppeteer.launch({
    headless: true,
    timeout: 0,
    defaultViewport: null,
    args: [
      "--disable-setuid-sandbox",
      "--no-sandbox",
      "--single-process",
      "--no-zygote",
    ],
    executablePath:
      process.env.NODE_ENV === "production"
        ? process.env.PUPPETEER_EXECUTABLE_PATH
        : puppeteer.executablePath()
  });
  const page = await browser.newPage({ timeout: 500 });

  try {
    for (let i = 0; i < stocksToCheck.length; i++) {
      console.log(`Scraping data for stock number ${i + 1}`);
      const stock = stocksToCheck[i];
      await page.goto(stock.avanzaUrl, {
        timeout: 5000,
        waitUntil: "networkidle2",
      });
      await delay(500);
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
          //console.error(e);
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
          t += c;
          return t;
        }, 0);
        const totalCurrentWorth = stock.transactionCosts.length * currentValue;
        item.totalMoneySpent = totalMoneySpent;
        item.totalCurrentWorth = totalCurrentWorth;

        item.profitEarnedSEK = round(totalCurrentWorth - totalMoneySpent, 2);

        const percentageDiff = totalCurrentWorth / totalMoneySpent;
        let diffPercent;

        if (percentageDiff > 1) {
          diffPercent = (percentageDiff - 1) * 100;
        } else {
          diffPercent = (1 - percentageDiff) * 100;
        }
        diffPercent = round(diffPercent, 2);
        item.diffPercent = diffPercent;
      }
      item.ownsStock = stock.transactionCosts && stock.transactionCosts.length > 0;
      item.amount = stock.transactionCosts ? stock.transactionCosts.length : 0;

      result.push(item);
    }
    console.log(result);
  } catch (e) {
    console.error(e);
  }
  //await delay(3000000);
  await browser.close();
  await sendMail(result);
}

// Main function
const run = async () => {
  console.log(`Starting scraping script...`);
  await startScraping();
}

module.exports = {
  run
}