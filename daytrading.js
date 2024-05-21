const puppeteer = require("puppeteer");
const { Table } = require("console-table-printer");
require('dotenv').config();

const { delay, readFile, round } = require('./helpers.js');

const urls = [
    "https://www.avanza.se/aktier/om-aktien.html/1247224/hut-8-mining",
    "https://www.avanza.se/aktier/om-aktien.html/975972/quickbit",
    "https://www.avanza.se/aktier/om-aktien.html/667476/academedia",
    "https://www.avanza.se/aktier/om-aktien.html/1300923/bitfarms",
    "https://www.avanza.se/aktier/om-aktien.html/5583/intrum",
    "https://www.avanza.se/aktier/om-aktien.html/399875/microstrategy-a",
    "https://www.avanza.se/aktier/om-aktien.html/794954/riot-platforms",
    "https://www.avanza.se/borshandlade-produkter/certifikat-torg/om-certifikatet.html/1623064/virtune-staked-ethereum",
    "https://www.avanza.se/borshandlade-produkter/certifikat-torg/om-certifikatet.html/1639655/virtune-bitcoin",
];

const stocks = urls.map(u => ({
    url: u
}));

let count = 1;
const settings = {
    interval: 120000
}

const clickButtonWithText = async (page, text) => {
    const [button] = await page.$x(`//button[contains(., '${text}')]`);
    if (button) {
        await button.click();
        return;
    } else {
        console.warn(`Button with text ${text} could not be found`);
        return;
    }
}

const printTable = async (stocks) => {
    console.clear('');
    console.log(`Iteration ${count}`)
    stocks.forEach((row) => {
        console.log(`\x1b[35m ${row.name} \x1b[0m`);
        const arrows = row.history.slice(-15).reduce((t, c, i) => {
            const previousValue = row.history[i - 1];
            if (previousValue && previousValue.currentValue && previousValue.currentValue > c.currentValue) { // Decrease
                t += `\x1b[31m↘\x1b[0m`;
            } else if (previousValue && previousValue.currentValue && previousValue.currentValue < c.currentValue) {
                t += `\x1b[32m↗\x1b[0m`;
            } else {
                t += '-';
            }
            return t;
        }, ' ');
        if (arrows !== '-') {
            console.log(`\t ${arrows}`)
        }

        const valueChangeHistory = row.history.slice(-15).reduce((t, c, i) => {
            const isLast = i === (row.history.length - 1);
            const previousValue = row.history[i - 1];
            if (previousValue && previousValue.currentValue && previousValue.currentValue > c.currentValue) { // Decrease
                t += `\x1b[31m${(round(c.currentValue) + '').trim()}\x1b[0m`;
            } else if (previousValue && previousValue.currentValue && previousValue.currentValue < c.currentValue) {
                t += `\x1b[32m${(round(c.currentValue) + '').trim()}\x1b[0m`;
            } else {
                t += `${round(c.currentValue)}`;
            }
            if (!isLast) {
                t += '\x1b[94m | \x1b[0m';
            }
            return t;
        }, `\x1b[94m Value in ${row.currency} \x1b[0m\t`);
        console.log(`\t ${valueChangeHistory}`);

        const percentageChange = row.history.slice(-15).reduce((t, c, i) => {
            const isLast = i === (row.history.length - 1);
            const previousValue = row.history[i - 1];
            if (previousValue && previousValue.oneDayChange && previousValue.oneDayChange > c.oneDayChange) { // Decrease
                t += `\x1b[31m${(round(c.oneDayChange) + '').trim()}%\x1b[0m`;
            } else if (previousValue && previousValue.oneDayChange && previousValue.oneDayChange < c.oneDayChange) {
                t += `\x1b[32m${(round(c.oneDayChange) + '').trim()}%\x1b[0m`;
            } else {
                t += `${round(c.oneDayChange)}%`;
            }
            if (!isLast) {
                t += '\x1b[94m | \x1b[0m';
            }
            return t;
        }, `\x1b[94m 1d change % \x1b[0m\t`);
        console.log(`\t ${percentageChange}`);
    });
    return;
};

const lookUpStocks = async (browser, page) => {
    await delay(1000);
    for (let i = 0; i < stocks.length; i++) {
        const stock = stocks[i];
        page = await browser.newPage({ timeout: 8000 });
        await page.goto(stocks[i].url, {
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
                //console.warn(`Could not find selector aza-period-button:nth-child(${j + 1}) for stock number ${i + 1}.`);
            }
        }
        const name = await page.$eval(
            'header h1',
            (element) => element.textContent
        );
        stock.name = name;
        let currentValue = await page.$eval(
            'aza-quote span[data-e2e="tbs-quote-latest-value"]',
            (element) => element.textContent
        );

        let currency;
        if (currentValue.includes('SEK')) currency = 'SEK';
        if (currentValue.includes('USD')) currency = 'USD';
        stock.currency = currency;

        currentValue = currentValue.trim();
        currentValue = currentValue.replaceAll(/\s/g, '');
        currentValue = currentValue.replaceAll(/SEK/g, '');
        currentValue = currentValue.replaceAll(/USD/g, '');
        currentValue = currentValue.replace(',', '.');
        currentValue = Number(currentValue);

        const item = {
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
        if (!stock.history) stock.history = [];
        stock.history.push(item);
    }
    await printTable(stocks, false);
    count++;
    return;
}
const start = async (userSettings = null) => {
    if (!userSettings) {
        console.error('No user settings file found, aborting');
        return;
    }
    if (!userSettings.stocks) {
        console.error('User settings file does not contain stocks list, aborting');
        return;
    }

    let browser;
    //let avanzaPage;
    let page;

    try {
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
        /* avanzaPage = await browser.newPage({ timeout: 8000 });
        await avanzaPage.goto(`https://www.avanza.se`, {
            timeout: 20000,
            waitUntil: "networkidle2",
        });
        await delay(2500);
        await clickButtonWithText(avanzaPage, 'Logga in');
        await delay(1000);
        await clickButtonWithText(avanzaPage, 'Användarnamn');
        await avanzaPage.type('input[placeholder="Användarnamn"]', process.env.AVANZA_USERNAME, { delay: 60 });
        await avanzaPage.type('input[placeholder="Lösenord"]', process.env.AVANZA_PASSWORD, { delay: 60 }); */

        await delay(600);
        await lookUpStocks(browser, page);

        setInterval(() => {
            lookUpStocks(browser, page);
        }, settings.interval)
    } catch (e) {
        console.error(e);
    } finally {
        // do something
    }
}

// Main function
const run = async () => {
    console.log(`Starting scraping script...`);
    const userSettings = await readFile('usersettings.json');
    await start(userSettings);
}

run();