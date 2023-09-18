const { Table } = require('console-table-printer');

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
    return process.argv.map(x => {
        if (x.includes('=')) {
            return {
                name: x.split('=')[0],
                value: x.split('=')[1],
            };
        }
    }).filter(x => !!x); // filter out empty ones
}

const delay = ms => new Promise(resolve => {
    setTimeout(() => {
        resolve();
    }, ms);
});

const printTable = data => new Promise(resolve => {
    const ownedStocks = data.filter(x => x.ownsStock);
    const nonOwnedStocks = data.filter(x => !x.ownsStock);

    const generateTable = (table, ownsStock) => {
        const p = new Table({
            columns: [
                { name: 'Name', alignment: 'left', color: 'red' }
            ]
        });
        table.forEach(row => {
            const rowObj = {
                'Name': row.name,
                '1d': `${row.oneDayChange >= 0 ? '+' : ''}${row.oneDayChange}%`,
                '1w': `${row.oneWeekChange >= 0 ? '+' : ''}${row.oneWeekChange}%`,
                '1m': `${row.oneMonthChange >= 0 ? '+' : ''}${row.oneMonthChange}%`,
                '3m': `${row.threeMonthsChange >= 0 ? '+' : ''}${row.threeMonthsChange}%`,
                '1y': `${row.oneYearChange >= 0 ? '+' : ''}${row.oneYearChange}%`,
                'This year': `${row.thisYearChange >= 0 ? '+' : ''}${row.thisYearChange}%`,
                '3y': `${row.threeYearsChange >= 0 ? '+' : ''}${row.threeYearsChange}%`,
                '5y': `${row.fiveYearsChange >= 0 ? '+' : ''}${row.fiveYearsChange}%`,
                'All time': `${row.allTimeChange >= 0 ? '+' : ''}${row.allTimeChange}%`,
                'Current value': `${row.currentValue}  ${row.currency}`
            };
            if (ownsStock) {
                rowObj['Amount'] = `${row.amount}`;
                rowObj['Total money spent'] = `${row.totalMoneySpent} ${row.currency}`;
                rowObj['Total value'] = `${row.totalCurrentWorth} ${row.currency}`;
                rowObj['Total value'] = `${row.totalCurrentWorth} ${row.currency}`;
                rowObj['Profit'] = `${row.profitEarnedSEK} ${row.currency}`;
                rowObj['Profit %'] = `${row.diffPercent}%`;
            }
            p.addRow(rowObj);
        });
        p.printTable();
    }

    console.log('Stocks you own');
    generateTable(ownedStocks, true);
    console.log('Stocks you don\'t own but are monitoring');
    generateTable(nonOwnedStocks, false);

    resolve();
});

module.exports = {
    getParamters,
    delay,
    printTable
};