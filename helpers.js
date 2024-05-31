const { Table } = require("console-table-printer");
const fs = require("fs");

/*
This function will get all the paramaters, both keys and values, that were present
when running this script. For instance if the user ran the command:

node index.js hey=1 lol=5 test=wzup

then this function will return:

[
  { key: 'hey': value: '1' },
  { key: 'lol': value: '5' },
  { key: 'test': value: 'wzup' }
]
*/
const getParamters = () => {
    return process.argv
        .map((x) => {
            if (x.includes("=")) {
                return {
                    name: x.split("=")[0],
                    value: x.split("=")[1],
                };
            }
        })
        .filter((x) => !!x); // filter out empty ones
};

const delay = (ms) =>
    new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, ms);
    });

const printTable = async (data, showHeader = true) => {
    const ownedCryptos = data.filter((x) => x.cryptoCoin);
    const ownedStocks = data.filter((x) => x.ownsStock && !x.cryptoCoin);
    const nonOwnedStocks = data.filter((x) => !x.ownsStock && !x.cryptoCoin);

    const generateCryptoTable = (table) => {
        const p = new Table({
            columns: [{ name: "Name", alignment: "left", color: "red" }],
        });
        table.forEach((row) => {
            const rowObj = {
                Name: row.name,
                "Amount owned": row.amountOwned,
                "Total value": `${round(row.currentTotalValue)} ${row.currency}`,
            };
            p.addRow(rowObj);
        });
        p.printTable();
    };
    const generateTable = (table, ownsStock) => {
        const p = new Table({
            columns: [{ name: "Name", alignment: "left", color: "red" }],
        });
        table.forEach((row) => {
            const rowObj = {
                Name: row.name,
                "1d": row.oneDayChange ? (`${row.oneDayChange >= 0 ? "+" : ""}${row.oneDayChange}%`) : '-',
                "1w": row.oneWeekChange ? (`${row.oneWeekChange >= 0 ? "+" : ""}${row.oneWeekChange}%`) : '-',
                "1m": row.oneMonthChange ? (`${row.oneMonthChange >= 0 ? "+" : ""}${row.oneMonthChange}%`) : '-',
                "3m": row.threeMonthsChange  ? (`${row.threeMonthsChange >= 0 ? "+" : ""}${row.threeMonthsChange }%`) : '-',
                "1y": row.oneYearChange ? (`${row.oneYearChange >= 0 ? "+" : ""}${row.oneYearChange}%`) : '-',
                "This year": row.thisYearChange  ? (`${row.thisYearChange >= 0 ? "+" : ""}${row.thisYearChange }%`) : '-',
                "3y": row.threeYearsChange ? (`${row.threeYearsChange >= 0 ? "+" : ""}${row.threeYearsChange}%`) : '-',
                "5y": row.fiveYearsChange ? (`${row.fiveYearsChange >= 0 ? "+" : ""}${row.fiveYearsChange}%`) : '-',
                "All time": row.allTimeChange ? (`${row.allTimeChange >= 0 ? "+" : ""}${row.allTimeChange}%`) : '-',
                "Current value": `${row.currentValue}  ${row.currency}`,
            };
            if (ownsStock) {
                rowObj["Amount"] = `${row.amount}`;
                rowObj["Total money spent"] = `${round(row.totalMoneySpent)} ${row.currency
                    }`;
                rowObj["Avg/item"] = `${round(row.avgPricePerItem)} ${row.currency
                    }`;
                rowObj["Total value"] = `${round(row.totalCurrentWorth)} ${row.currency
                    }`;
                rowObj["Total value SEK"] = row.totalCurrentWorthInSEK
                    ? `${round(row.totalCurrentWorthInSEK)} SEK`
                    : "-";
                rowObj["Profit"] = `${row.profitEarnedSEK} ${row.currency}`;
                rowObj["Profit %"] = `${row.diffPercent}%`;
            }
            p.addRow(rowObj);
        });
        p.printTable();
    };

    if (ownedCryptos && ownedCryptos.length > 0) {
        console.log("Kraken currencies you own");
        generateCryptoTable(ownedCryptos);
    }
    if (ownedStocks && ownedStocks.length > 0) {
        console.log("Stocks you own");
        generateTable(ownedStocks, true);
        let totalWorthSEK = 0;
        for (let i = 0; i < ownedStocks.length; i++) {
            const s = ownedStocks[i];
            if (s.currency === "SEK" && s.totalCurrentWorth) {
                totalWorthSEK += Number(s.totalCurrentWorth);
            } else if (s.totalCurrentWorthInSEK) {
                totalWorthSEK += Number(s.totalCurrentWorthInSEK);
            }
        }
        console.log(`All currently worth ${round(totalWorthSEK)} SEK`);
    }

    if (nonOwnedStocks && nonOwnedStocks.length > 0) {
        if (showHeader) {
            console.log("Stocks you don't own but are monitoring");
        }
        generateTable(nonOwnedStocks, false);
    }
    return;
};

const round = (number, numberOfDecimals = 2, forceDecimals = false) => {
    number = number * Math.pow(10, numberOfDecimals);
    number = Math.round(number);
    number = number / Math.pow(10, numberOfDecimals);

    if ((number + '').includes('.') && (number + '').split('.')[1] && (number + '').split('.')[1].length === 1) {
        number += '0';
    }
    if (forceDecimals && !(number + '').includes('.')) {
        number += '.00';
    }

    return number;
};

const readFile = (filePath) => new Promise((resolve, reject) => {
    fs.readFile(filePath, function (err, file) {
        if (err) {
            console.error(`Error while reading the ${filePath}:`, err);
            reject();
        }
        try {
            const data = JSON.parse(file);
            // output the parsed data
            resolve(data);
        } catch (err) {
            console.error("Error while parsing JSON data:", err);
            reject();
        }
    });
});

const clickButtonWithText = async (page, text, elementType = 'button') => {
    const [button] = await page.$x(`//${elementType}[contains(., '${text}')]`);
    if (button) {
        await button.click();
        return;
    } else {
        console.warn(`Button with text ${text} could not be found`);
        return;
    }
}

module.exports = {
    getParamters,
    delay,
    printTable,
    round,
    readFile,
    clickButtonWithText
};
