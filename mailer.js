const nodemailer = require('nodemailer');
require('dotenv').config();

const GREEN_COLOR = 'green';
const RED_COLOR = 'red';

const { round } = require('./helpers.js');
const { getDescriptionOfOwnedStocks, getDescriptionOfNonOwnedStocks } = require('./aiHelper.js');

const PREDEFINED_MAIL_CONFIGS = {
    OUTLOOK: {
        service: 'hotmail',
        secure: false,
        port: 587
    },
    ZOHOMAIL: {
        host: 'smtp.zoho.eu',
        secure: true,
        port: 465
    }
}

const generateCryptoTable = stocks => {
    let table = `
        <table border="1" style="width: 100%;">
        <thead>
            <tr>
                <th>
                    <strong>
                        Name
                    </strong>
                </th>
                <th>
                    <strong>
                        Amount owned
                    </strong>
                </th>
                <th>
                    <strong>
                        Total value
                    </strong>
                </th>
            </tr>
        </thead>
    `;
    for (let i = 0; i < stocks.length; i++) {
        const data = stocks[i];
        table += `
        <tr>
            <td>
                ${data.name}
            </td>
            <td>
                ${data.amountOwned}
            </td>
            <td>
                ${round(data.currentTotalValue)} ${data.currency}
            </td>
        </tr>
        `;
    }
    table += '</table>';
    return table;
}
const generateTable = (stocks, owned) => {
    let table = `
        <table border="1" style="width: 100%;">
        <thead>
            <tr>
                <th>
                    <strong>
                        Name
                    </strong>
                </th>
                <th>
                    <strong>
                        1d
                    </strong>
                </th>
                <th>
                    <strong>
                        1w
                    </strong>
                </th>
                <th>
                    <strong>
                        1m
                    </strong>
                </th>
                <th>
                    <strong>
                        3m
                    </strong>
                </th>
                <th>
                    <strong>
                        This year
                    </strong>
                </th>
                <th>
                    <strong>
                        1y
                    </strong>
                </th>
                <th>
                    <strong>
                        3y
                    </strong>
                </th>
                <th>
                    <strong>
                        5y
                    </strong>
                </th>
                <th>
                    <strong>
                        Max
                    </strong>
                </th>
                ${owned ? `
                    <th>
                        <strong>
                            Amount
                        </strong>
                    </th>
                    <th>
                        <strong>
                            Price/item
                        </strong>
                    </th>
                    <th>
                        <strong>
                            Total investment
                        </strong>
                    </th>
                    <th>
                        <strong>
                            Avg/item
                        </strong>
                    </th>
                    <th>
                        <strong>
                            Total value
                        </strong>
                    </th>
                    <th>
                        <strong>
                            Total value SEK
                        </strong>
                    </th>
                    <th>
                        <strong>
                            Diff
                        </strong>
                    </th>
                    <th>
                        <strong>
                            % Diff
                        </strong>
                    </th>
                    ` : ''
        }
            </tr>
        </thead>
    `;
    const getColor = value => {
        if (value) {
            return value >= 0 ? GREEN_COLOR : RED_COLOR
        } else {
            return 'transparent';
        }
    }

    for (let i = 0; i < stocks.length; i++) {
        const data = stocks[i];
        table += `
        <tr>
            <td>
                <a href="${data.avanzaUrl}" target="_blank">
                    ${data.name}
                </a>
            </td>
            <td bgcolor="${getColor(data.oneDayChange)}">
                ${data.oneDayChange}%
            </td>
            <td bgcolor="${getColor(data.oneWeekChange)}">
                ${data.oneWeekChange}%
            </td>
            <td bgcolor="${getColor(data.oneMonthChange)}">
                ${data.oneMonthChange}%
            </td>
            <td bgcolor="${getColor(data.threeMonthsChange)}">
                ${data.threeMonthsChange}%
            </td>
            <td bgcolor="${getColor(data.thisYearChange)}">
                ${data.thisYearChange}%
            </td>
            <td bgcolor="${getColor(data.oneYearChange)}">
                ${data.oneYearChange}%
            </td>
            <td bgcolor="${getColor(data.threeYearsChange)}">
                ${data.threeYearsChange ? `${data.threeYearsChange}%` : '-'}
            </td>
            <td bgcolor="${getColor(data.fiveYearsChange)}">
                ${data.fiveYearsChange ? `${data.fiveYearsChange}%` : '-'}
            </td>
            <td bgcolor="${getColor(data.allTimeChange)}">
                ${data.allTimeChange ? `${data.allTimeChange}%` : '-'}
            </td>
            ${owned ? `
                <td>
                    ${data.amount} st
                </td>
                <td>
                    ${data.currentValue} ${data.currency}
                </td>
                <td>
                    ${data.totalMoneySpent ? `${round(data.totalMoneySpent)} ${data.currency}` : '-'}
                </td>
                <td>
                    ${data.avgPricePerItem ? `${round(data.avgPricePerItem)} ${data.currency}` : '-'}
                </td>
                <td>
                    ${data.totalCurrentWorth ? `${round(data.totalCurrentWorth)} ${data.currency}` : '-'}
                </td>
                <td>
                    ${data.totalCurrentWorthInSEK ? `${round(data.totalCurrentWorthInSEK)} SEK` : '-'}
                </td>
                <td bgcolor="${getColor(data.profitEarnedSEK)}">
                    ${data.profitEarnedSEK ? `${round(data.profitEarnedSEK)} ${data.currency}` : '-'}
                </td>
                <td bgcolor="${getColor(data.diffPercent)}">
                    ${data.diffPercent || 0}%
                </td>` : ''
            }            
        </tr>
        `;
    }
    table += '</table>';
    return table;
}

const sendMail = async mailData => {
    const transporter = nodemailer.createTransport({
        ...PREDEFINED_MAIL_CONFIGS.ZOHOMAIL,
        auth: {
            user: process.env.MAIL_ADDRESS2,
            pass: process.env.MAIL_PASSWORD2
        }
    });

    const ownedCryptos = mailData.filter(x => x.cryptoCoin);
    const ownedStocks = mailData.filter(x => x.ownsStock);
    const nonOwnedStocks = mailData.filter(x => !x.ownsStock && !x.cryptoCoin);

    let descriptionOfOwnedStocks;
    let descriptionOfNonOwnedStocks;

    if (process.env.CHATGPT_KEY) {
        console.log('Ask Open-AI to summarize the current situation ...');
        if (ownedStocks && ownedStocks.length > 0) {
            descriptionOfOwnedStocks = await getDescriptionOfOwnedStocks(ownedStocks);
        }
        if (nonOwnedStocks && nonOwnedStocks.length > 0) {
            descriptionOfNonOwnedStocks = await getDescriptionOfNonOwnedStocks(nonOwnedStocks);
        }
    } else {
        console.warn('No chatgpt token found, cannot formulate description using open AI');
    }

    const ownedCryptosTotalWorth = ownedCryptos.reduce((t, c) => {
        if (c.currentTotalValue) {
            t += Number(c.currentTotalValue);
        }
        return t;
    }, 0);
    const ownedStocksTotalWorth = ownedStocks.reduce((t, c) => {
        if (c.currency === 'SEK' && c.totalCurrentWorth) {
            t += Number(c.totalCurrentWorth);
        } else if (c.totalCurrentWorthInSEK) {
            t += Number(c.totalCurrentWorthInSEK);
        }
        return t;
    }, 0);

    const html = `
        <div>
            <div>
                <h2>
                    Hello ${process.env.name ? process.env.name : 'anonymous user'}!
                </h2>
            </div>
            <div>
                <p>
                    This is your daily stock report.
                </p>
            </div>
            <div>
                <h3>Kraken balance</h3>
            </div>
            <div>
                ${generateCryptoTable(ownedCryptos)}
            </div>
            <div>
                Total worth: ${round(ownedCryptosTotalWorth)} SEK
            </div>
            <div>
                <h3>Avanza items you own</h3>
            </div>
            ${descriptionOfOwnedStocks ? `<div style="margin-bottom: 25px;">${descriptionOfOwnedStocks}</div>` : ''}
            <div>
                ${generateTable(ownedStocks, true)}
            </div>
            <div>
                Total worth: ${round(ownedStocksTotalWorth)} SEK
            </div>
            <div style="margin-top: 25px;">
                <h3>Avanza items you do not own but are currently monitoring</h3>
            </div>
            ${descriptionOfNonOwnedStocks ? `<div style="margin-bottom: 25px;">${descriptionOfNonOwnedStocks}</div>` : ''}
            <div>
                ${generateTable(nonOwnedStocks, false)}
            </div>
        </div>
    `;

    const date = new Date();
    let month = date.getMonth() >= 10 ? date.getMonth() : `0${date.getMonth()}`;
    let day = date.getDate() >= 10 ? date.getDate() : `0${date.getDate()}`;
    let year = date.getFullYear();
    let hours = date.getHours() >= 10 ? date.getHours() : `0${date.getHours()}`;
    let minutes = date.getMinutes() >= 10 ? date.getMinutes() : `0${date.getMinutes()}`;
    let seconds = date.getSeconds() >= 10 ? date.getSeconds() : `0${date.getSeconds()}`;
    const dateAndTimestamp = `${month}-${day}-${year} ${hours}:${minutes}:${seconds}`;

    const mailOptions = {
        from: process.env.MAIL_ADDRESS2,
        to: process.env.MAIL_ADDRESS_TO,
        subject: `💰 Stock report ${dateAndTimestamp}`,
        html
    };

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
            throw 'Could not send email';
        } else {
            console.log('Email sent!');
            return;
        }
    });
}

module.exports = {
    sendMail
};