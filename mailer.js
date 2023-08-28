const nodemailer = require('nodemailer');
require('dotenv').config();

const GREEN_COLOR = 'green';
const RED_COLOR = 'red';

const generateTable = stocks => {
    let table = `
        <table border="1" style="width: 100%;">
        <thead>
            <tr>
                <th>
                    <strong>
                        Namn
                    </strong>
                </th>
                <th>
                    <strong>
                        1d
                    </strong>
                </th>
                <th>
                    <strong>
                        1v
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
                        I år
                    </strong>
                </th>
                <th>
                    <strong>
                        1 år
                    </strong>
                </th>
                <th>
                    <strong>
                        3 år
                    </strong>
                </th>
                <th>
                    <strong>
                        5 år
                    </strong>
                </th>
                <th>
                    <strong>
                        Max
                    </strong>
                </th>
                <th>
                    <strong>
                        Antal
                    </strong>
                </th>
                <th>
                    <strong>
                        Pris / aktie
                    </strong>
                </th>
                <th>
                    <strong>
                        Totalt SEK investerat
                    </strong>
                </th>
                <th>
                    <strong>
                        Totalt nuvarande värde
                    </strong>
                </th>
                <th>
                    <strong>
                        SEK diff
                    </strong>
                </th>
                <th>
                    <strong>
                        % diff
                    </strong>
                </th>
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
                ${data.name}
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
            <td>
                ${data.amount} st
            </td>
            <td>
                ${data.currentValue} ${data.currency}
            </td>
            <td>
                ${data.totalMoneySpent ? `${data.totalMoneySpent} ${data.currency}` : '-'}
            </td>
            <td>
                ${data.totalCurrentWorth ? `${data.totalCurrentWorth} ${data.currency}` : '-'}
            </td>
            <td bgcolor="${getColor(data.profitEarnedSEK)}">
                ${data.profitEarnedSEK ? `${data.profitEarnedSEK} ${data.currency}` : '-'}
            </td>
            <td bgcolor="${getColor(data.diffPercent)}">
                ${data.diffPercent || 0}%
            </td>
        </tr>
        `;
    }
    table += '</table>';
    return table;
}

const sendMail = (mailData) =>
    new Promise((resolve, reject) => {
        const transporter = nodemailer.createTransport({
          service: 'hotmail',
          secure: false,
          port: 587,
          auth: {
            user: process.env.MAIL_ADDRESS,
            pass: process.env.MAIL_PASSWORD
          }
        });

        console.log('mailData', mailData);

        const ownedStocks = mailData.filter(x => x.ownsStock);
        const nonOwnedStocks = mailData.filter(x => !x.ownsStock);
        
        const html = `
            <div>
                <div>
                    <h2>
                        Hej Martin!
                    </h2>
                </div>
                <div>
                    <p>
                        Detta är din dagliga aktie-rapport.
                    </p>
                </div>
                <div>
                    <h3>Aktier du äger</h3>
                </div>
                <div>
                    ${generateTable(ownedStocks)}
                </div>
                <div style="margin-top: 25px;">
                    <h3>Aktier du inte äger men bevakar</h3>
                </div>
                <div>
                    ${generateTable(nonOwnedStocks)}
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
        const dateAndTimestamp = `${month}-${day}-${year}--${hours}:${minutes}:${seconds}`;
        
        const mailOptions = {
          from: process.env.MAIL_ADDRESS,
          to: process.env.MAIL_ADDRESS,
          subject: `💰 Aktierapport ${dateAndTimestamp}`,
          html
        };
        
        transporter.sendMail(mailOptions, function(error, info){
          if (error) {
            console.log(error);
            reject();
          } else {
            console.log('Email sent: ' + info.response);
            resolve();
          }
        });
    })

module.exports = {
    sendMail
};