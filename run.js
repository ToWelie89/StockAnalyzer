const { run } = require('./scraper.js');

const start = async () => {
    console.log('Start script...');
    await run();
    console.log('Stock analyzing complete!!');
}

start();