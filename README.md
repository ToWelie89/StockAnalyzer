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
```
3. In the file `mailer.js` check out the function `sendMail`. The object `transporter` might need to be configured depending on the email host used to send email. If the host is hotmal, then you don't need to change anything, but if it is another host you might have to specicy a host in the transporter-object. The email functionality relies on the npm module `nodemailer`, please read [this](https://nodemailer.com/smtp/) page on how to setup the transporter config accruately.
4. Go to the file `stocks.js` and configure the stocks you wish to monitor here. StockAnalyzer currently only supports links to `avanza.se`.

## Run scraping from terminal

Run
```
node run.js
```
Assuming you have correctly configured StockAnalyzer as explained above, the script will now run. It will scrape current scrape value of all configured stocks.