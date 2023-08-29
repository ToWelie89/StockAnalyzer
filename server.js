const express = require('express');
const app = express();

const { run } = require('./scraper.js');

const PORT = process.env.PORT || 4000;

app.get('/ping', async (req, res) => {
    res.send('pinged!!');
});

app.get('/scrape', async (req, res) => {
    res.send('started scraping');
    await run();
});

app.get('/', (req, res) => {
    res.send('Test');
});

app.listen(PORT, () => {
    console.log('Listening on http://127.0.0.1:' + PORT);
});