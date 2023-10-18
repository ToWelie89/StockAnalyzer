![Logo](https://raw.githubusercontent.com/ToWelie89/StockAnalyzer/master/logo.png)
## Introduction

This script will analyze current development of stocks and then send a mail to a given address where you get a report summary.

## Prerequisites

* Node (not sure which is the oldest compatible version, I run Node 18)

## Getting started

1. Run `npm install`
2. Create a file named .env in the root folder and add the following contents to it (this will be the email used both for sending the mail, and also the recipient of the email, in order words, the scripts makes it so that you send an email to yourself):
```
MAIL_ADDRESS="<YOUR EMAIL>"
MAIL_PASSWORD="<YOUR EMAIL PASSWORD>"
CHATGPT_KEY="<YOUR OPEN AI KEY>"
NAME="<YOUR NAME>"
```
Note: if you have no OpenAI key then simply skip that part, in which case you wont get the AI-written summary in the emailed report, but you will still get the data.

3. In the file `mailer.js` check out the function `sendMail`. The object `transporter` might need to be configured depending on the email host used to send email. If the host is hotmal, then you don't need to change anything, but if it is another host you might have to specicy a host in the transporter-object. The email functionality relies on the npm module `nodemailer`, please read [this](https://nodemailer.com/smtp/) page on how to setup the transporter config accurately.
4. Go to the file `stocks.js` and configure the stocks you wish to monitor here. StockAnalyzer currently only supports links to `avanza.se`. The format should be like this:
```js
module.exports = {
    stocks: [
        {
            avanzaUrl: 'https://www.avanza.se/borshandlade-produkter/certifikat-torg/om-certifikatet.html/563966/bitcoin-xbt', // URL to Avanza page here for the item
            transactionCosts: [
                // If you have invested in this item, add the price of each transaction in this array
                1290.12,
                1214.85
            ]
        }, {
            avanzaUrl: 'https://www.avanza.se/aktier/om-aktien.html/399875/microstrategy-a'
            // If you never invested in this item but just want to monitor it's development,
            // only have the "avanzaUrl"-property and skip the transactionCosts-array altogether
        }
        etc
    ]
}
```

## Run scraping from terminal

Run
```
node run.js
```
Assuming you have correctly configured StockAnalyzer as explained above, the script will now run. It will scrape current scrape value of all configured stocks.

## Deploy to cloud

It is possible to deploy Stock Analyzer to the cloud service called Render, and then have it file a report and send it to you on a given interval without having to run the script manually from your own computer.

I made a video where I detail how to do this, please watch it [here](https://youtu.be/dmIhMVnMOhw?si=19OGXqPO7mIHCsAk&t=190).