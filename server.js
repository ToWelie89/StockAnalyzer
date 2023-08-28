const express = require('express');
const app = express();

const { run } = require('./scraper.js');

app.get('/scrape', async (req, res) => {
    await run();
});

app.get('/', (req, res) => {
    res.send('Test');
});

app.listen(4000, () => {
    console.log('Listening on http://127.0.0.1:4000');
});