const fs = require('fs');
const Chance = require('chance');

require('dotenv').config();
const readline = require('readline');
const asciichart = require('asciichart')
const KrakenClient = require('kraken-api');
const notifier = require('node-notifier');
const { round } = require('./helpers');
const { getAverages, isMovingDown, isMovingUp } = require('./krakenHelpers');
const kraken = new KrakenClient(process.env.KRAKEN_API_KEY, process.env.KRAKEN_PRIVATE_KEY);

const { list } = require('./historicaldata');

let fileName;
let intervalCounter = 0;
let testHistory = [];
let actions = [];

const ACTIONS = {
    HAS_SOLD: 'HAS_SOLD',
    HAS_BOUGHT: 'HAS_BOUGHT',
    TRADE_COMPLETE: 'TRADE_COMPLETE',
    NONE: 'NONE'
};

const settings = {
    intervalPerTick: 15000,
    /* intervalsToCheckForDownwardsTrend: 5, // sell
    ticksPerIntervalForDownwardsTrend: 5,
    percentageOfTicksThatIsNeededForDownwardTrend: 0.75,

    intervalsToCheckForUpwardsTrend: 5, // buy
    ticksPerIntervalForUpwardsTrend: 5,
    percentageOfTicksThatIsNeededForUpwardsTrend: 0.75, */

    minSellChangePerc: 0.989,
    minBuyChangePerc: 1.018,
    amountToSell: 1,// 60% BTC sold every sell action
    minimumEurosNeededForBuying: 1.0
};

let sellingIsInProgress;

let history = [];
let tradeHistory = [];

let priceWhenBought;
let priceWhenSold;

let IS_SIMULATION = true;

const BUY_FEE = 0.0026; // 0.26%
const SELL_FEE = 0.0026; // 0.26%
let SIMULATION_BALANCE = {
    error: [],
    result: {
        ALPHA: '0.00000',
        'EUR.HOLD': '0.0000',
        STORJ: '0.0000000000',
        USDT: '0.00000000',
        XCN: '230.3600',
        XXBT: '0.0041342600',
        XXMR: '0.0000000000',
        ZEUR: '0.00'
    }
};

const buyBitcoin = async (volume, currentPrice) => {
    if (IS_SIMULATION) {
        SIMULATION_BALANCE.result.ZEUR = Number(SIMULATION_BALANCE.result.ZEUR);
        SIMULATION_BALANCE.result.XXBT = Number(SIMULATION_BALANCE.result.XXBT);

        const fee = volume * BUY_FEE;
        SIMULATION_BALANCE.result.ZEUR -= volume;
        const volumeMinusFee = (volume - fee);
        const bitcoinGained = volumeMinusFee / currentPrice;
        SIMULATION_BALANCE.result.XXBT += bitcoinGained;

        log('');
        log(`Simulate buying: volume: ${volume}, volume-minus-fee: ${(volume - fee)}, bitcoin gained: ${bitcoinGained}`);
        log('Updated balance');
        log(SIMULATION_BALANCE);
        log('');

        return;
    } else {
        // volume is in Euros because of viqc flag
        await kraken.api('AddOrder', {
            ordertype: 'market',
            type: 'buy',
            volume,
            pair: 'XXBTZEUR',
            oflags: 'viqc',
        });
        return;
    }
}

const sellBitcoin = async (volume, currentPrice) => {
    if (IS_SIMULATION) {
        SIMULATION_BALANCE.result.ZEUR = Number(SIMULATION_BALANCE.result.ZEUR);
        SIMULATION_BALANCE.result.XXBT = Number(SIMULATION_BALANCE.result.XXBT);

        currentPrice = Number(currentPrice);

        const btcVolumeInEuros = volume * currentPrice;
        const btcVolumeMinusFee = btcVolumeInEuros - (SELL_FEE * btcVolumeInEuros);

        SIMULATION_BALANCE.result.ZEUR += btcVolumeMinusFee;
        SIMULATION_BALANCE.result.XXBT -= volume;

        log('');
        log(`Simulate selling: volume: ${volume}, currentPrice: ${currentPrice}, fee paid: ${(SELL_FEE * btcVolumeInEuros)}, € gained (after fee): ${btcVolumeMinusFee}`);
        log('Updated balance');
        log(SIMULATION_BALANCE);
        log('');
    } else {
        await kraken.api('AddOrder', {
            ordertype: 'market',
            type: 'sell',
            volume,
            pair: 'XXBTZEUR',
        });
        return;
    }
}

const getBalance = async (getReal = false) => {
    if (!getReal && IS_SIMULATION) {
        return SIMULATION_BALANCE;
    } else if (getReal) {
        const balance = await kraken.api('Balance');
        return balance;
    }
}

let ceiling = 38700;
let floor = 38450;

const startInterval = async (data = null) => {
    /* const func1 = async () => {
        clear();
        log('');

        const balance = await kraken.api('Balance');
        const res = await kraken.api('OHLC', { pair: 'XXBTZEUR' })
        res.result.XXBTZEUR.forEach(x => {
            const open = Number(x[1]);
            const high = Number(x[2]);
            const low = Number(x[3]);
            const close = Number(x[4]);
            const ohlcAverage = (open + high + low + close) / 4; // ohlc average
            const hlcAverage = (open + low + close) / 3; // hlc average
            x.push(ohlcAverage);
            x.push(hlcAverage);
        });

        if (history.length === 0) {
            history = res.result.XXBTZEUR.slice(0, 100).map(x => ({
                value: x[9]
            }));
        }

        let val = res.result.XXBTZEUR[0][9]; // ohlc
        let low = res.result.XXBTZEUR[0][3];
        let high = res.result.XXBTZEUR[0][2];
        let myValueInEuros;

        if (Number(val) >= 42500) {
            notifier.notify({
                title: 'BTC price high!',
                message: 'sell sell sell sell sell sell'
            });
        } else {
            if (Number(val) <= 38000) {
                notifier.notify({
                    title: 'BTC price low',
                    message: 'buy buy buy buy buy'
                });
            }
        }

        history.push({
            value: val,
            low,
            high,
            myValueInEuros,
            timestamp: Date.now()
        });

        const last20 = history.slice(-20);

        log(`LOW\t\t\tHIGH\t\t\tOHLC AVG\t \t\tMY VALUE`);
        log('');
        last20.forEach((x, i) => {
            let val = x.value;
            let high = x.value;
            let low = x.value;

            const lastValue = last20[i - 1];
            myValueInEuros = balance.result.XXBT * Number(val);

            if (lastValue && Number(val) < Number(lastValue.value)) {
                log(`${round(low, 2, true)}€\t\t${round(high, 2, true)}€\t\t${round(val, 2, true)}€\t\x1b[31m↘\x1b[0m \t\t${round(myValueInEuros, 2, true)}€`);
            } else if (lastValue && Number(val) > Number(lastValue.value)) {
                log(`${round(low, 2, true)}€\t\t${round(high, 2, true)}€\t\t${round(val, 2, true)}€\t\x1b[32m↗\x1b[0m \t\t${round(myValueInEuros, 2, true)}€`);
            } else {
                log(`${round(low, 2, true)}€\t\t${round(high, 2, true)}€\t\t${round(val, 2, true)}€\t \t\t${round(myValueInEuros, 2, true)}€`);
            }
        });
        log(asciichart.plot(history.map(x => x.value), { height: 5, colors: [asciichart.green] }));
    } */
    const func2 = async (testDataPoint = null) => {
        const balance = await getBalance();
        let currentValue = testDataPoint ? Number(testDataPoint.value) : ((await kraken.api('Ticker', { pair: 'XXBTZEUR' })).result.XXBTZEUR.c[0]);
        currentValue = Number(currentValue);
        let myValueInEuros;

        myValueInEuros = Number(balance.result.XXBT) * currentValue;

        const myCurrentlyOwnedBitcoins = Number(balance.result.XXBT);
        const myCurrentlyOwnedEuros = Number(balance.result.ZEUR);

        const lastValue = (history && history.length > 1) ? history[history.length - 2] : null;
        const isGoingDown = (lastValue && Number(currentValue) < Number(lastValue.value));
        const isGoingUp = (lastValue && Number(currentValue) > Number(lastValue.value));

        const averagesUp = getAverages(history, settings.intervalsToCheckForUpwardsTrend, settings.ticksPerIntervalForUpwardsTrend);
        const averagesDown = getAverages(history, settings.intervalsToCheckForDownwardsTrend, settings.ticksPerIntervalForDownwardsTrend);

        //log('Averages for each interval', averagesUp)
        //log('isMovingUp(averagesUp)', isMovingUp(averagesUp, settings.percentageOfTicksThatIsNeededForUpwardsTrend))
        //log('isMovingDown(averagesDown)', isMovingDown(averagesDown, settings.percentageOfTicksThatIsNeededForDownwardTrend))

        if (
            /* history.length >= (settings.ticksPerIntervalForUpwardsTrend * settings.intervalsToCheckForUpwardsTrend) &&
            isMovingUp(averagesUp, settings.percentageOfTicksThatIsNeededForUpwardsTrend) */
            history.length >= 180 &&
            history.slice(-180).filter(x => x.value >= Number(currentValue)).length >= 120 // Most previous tick values (15 / 20) are higher than this value
        ) {
            log('Detected a possible price bottom');
            const change = priceWhenSold ? (Number(currentValue) / priceWhenSold) : null;

            const top = history.slice(-180).map(x => x.value).sort((a, b) => b - a)[0];
            const bottom = history.slice(-180).map(x => x.value).sort((a, b) => b - a)[179];

            const k = currentValue / top;

            log(`Price when last sold: ${priceWhenSold}, current value: ${Number(currentValue)}, change: ${change}`);

            if (myCurrentlyOwnedEuros > settings.minimumEurosNeededForBuying) { // Can only buy if having euros in balance
                if (actions.slice(-1)[0] !== ACTIONS.HAS_BOUGHT) {
                    if (true/* !change || change <= settings.minBuyChangePerc */) {
                        if (k <= 0.998) {
                            try {
                                await performBuy(false, currentValue);
                            } catch (err) {
                                error(err);
                            }
                        } else {
                            warn('k-change not big enough');
                        }
                    } else {
                        warn('Aborting buy, price has not dropped enough');
                    }
                } else {
                    warn('Cannot buy as a buy has been previously performed and bot is now waiting to sell');
                }
            } else {
                warn('Cannot buy as you have no euros in balance');
            }
        } else if (
            /* history.length >= (settings.ticksPerIntervalForDownwardsTrend * settings.intervalsToCheckForDownwardsTrend) &&
            isMovingDown(averagesDown, settings.percentageOfTicksThatIsNeededForDownwardTrend) */
            history.length >= 180 &&
            history.slice(-180).filter(x => x.value <= Number(currentValue)).length >= 120 // most previous tick values (15 / 20) are lower than this value

        ) {
            log('Detected a possible price top');
            const change = priceWhenBought ? (Number(currentValue) / priceWhenBought) : null;

            const top = history.slice(-180).map(x => x.value).sort((a, b) => b - a)[0];
            const bottom = history.slice(-180).map(x => x.value).sort((a, b) => b - a)[179];

            const k = currentValue / top;

            if (actions.slice(-1)[0] !== ACTIONS.HAS_SOLD) {
                if (change && priceWhenBought) {
                    log(`Current price ${Number(currentValue)}, price when bought: ${priceWhenBought}`);
                    log(`Change is ${change}`);
                } else {
                    log(`Current price ${Number(currentValue)}`);
                }
                if (true/* (!change && !priceWhenBought) || (change && change <= settings.minSellChangePerc) */) { // 1.5% increase at least
                    if (k <= 0.998) {
                        try {
                            await performSell(false, Number(currentValue));
                        } catch (err) {
                            error(err);
                        }
                    } else {
                        warn('k-change not big enough')
                    }
                } else {
                    warn('Price has not changed enough from the bought-price to perform the sell');
                }
            } else {
                warn('Aborted sell since another sell was alreayd performed earlier, bot now waiting to buy to complete the trade');
            }
        }
        /* if (currentValue >= 40050) {
            notifier.notify({
                title: 'BTC price high!',
                message: 'sell sell sell sell sell sell'
            });
        } else {
            if (currentValue <= 39050 && myCurrentlyOwnedEuros > 0) {
                notifier.notify({
                    title: 'BTC price low',
                    message: 'buy buy buy buy buy'
                });
            }
        } */

        const dateAsString = new Date().toISOString().replace('T', ' ').split('.')[0];

        if (intervalCounter % 10 === 0) {
            log(`DATE\t\t\tBTC PRICE\t \tMY BTC VALUE \tBTC AMOUNT OWNED \t€ IN KRAKEN BALANCE`);
        }

        if (isGoingDown) {
            log(`${dateAsString}\t${round(currentValue, 2, true)}€\t\x1b[31m↘\x1b[0m \t${round(myValueInEuros, 2, true)}€ \t${(myCurrentlyOwnedBitcoins + '').slice(0, 10)} BTC \t\t${round(myCurrentlyOwnedEuros, 2, true)}€`);
        } else if (isGoingUp) {
            log(`${dateAsString}\t${round(currentValue, 2, true)}€\t\x1b[32m↗\x1b[0m \t${round(myValueInEuros, 2, true)}€ \t${(myCurrentlyOwnedBitcoins + '').slice(0, 10)} BTC \t\t${round(myCurrentlyOwnedEuros, 2, true)}€`);
        } else {
            log(`${dateAsString}\t${round(currentValue, 2, true)}€\t \t${round(myValueInEuros, 2, true)}€ \t${(myCurrentlyOwnedBitcoins + '').slice(0, 10)} BTC \t\t${round(myCurrentlyOwnedEuros, 2, true)}€`);
        }
        history.push({
            value: currentValue,
            myValueInEuros,
            isGoingUp,
            isGoingDown,
            timestamp: (testDataPoint && testDataPoint.timestamp) ? testDataPoint.timestamp : Date.now()
        });
        intervalCounter++;
    }
    const func3 = async (testDataPoint = null) => {
        let currentValue = testDataPoint ? Number(testDataPoint.value) : ((await kraken.api('Ticker', { pair: 'XXBTZEUR' })).result.XXBTZEUR.c[0]);
        currentValue = Number(currentValue);

        const lastValue = (history && history.length > 1) ? history[history.length - 2] : null;
        const isGoingDown = (lastValue && Number(currentValue) < Number(lastValue.value));
        const isGoingUp = (lastValue && Number(currentValue) > Number(lastValue.value));

        const balance = await getBalance();
        let myValueInEuros = Number(balance.result.XXBT) * currentValue;
        const myCurrentlyOwnedBitcoins = Number(balance.result.XXBT);
        const myCurrentlyOwnedEuros = Number(balance.result.ZEUR);

        if (history.length >= 50) {
            //const top = (history.slice(-30).sort((a, b) => b.value - a.value)[0]).value;
            const bottom = (history.slice(-50).sort((a, b) => b.value - a.value)[49]).value;
            //ceiling = top;
            floor = bottom;
        }

        if (priceWhenSold && ((currentValue + 50) < priceWhenSold)) {
            if (myCurrentlyOwnedEuros > settings.minimumEurosNeededForBuying) { // Can only buy if having euros in balance
                try {
                    await performBuy(false, currentValue);
                } catch (err) {
                    error(err);
                }
            } else {
                warn('Cannot buy as you have no euros in balance');
            }
        } else if ((currentValue >= (floor + 20)) && (!priceWhenBought || (currentValue > (priceWhenBought + 35)))) {
            try {
                await performSell(false, Number(currentValue));
            } catch (err) {
                error(err);
            }
        }

        const dateAsString = new Date().toISOString().replace('T', ' ').split('.')[0];
        if (intervalCounter % 10 === 0) {
            log(`DATE\t\t\tBTC PRICE\t \tMY BTC VALUE \tBTC AMOUNT OWNED \t€ IN KRAKEN BALANCE`);
        }
        if (isGoingDown) {
            log(`${dateAsString}\t${round(currentValue, 2, true)}€\t\x1b[31m↘\x1b[0m \t${round(myValueInEuros, 2, true)}€ \t${(myCurrentlyOwnedBitcoins + '').slice(0, 10)} BTC \t\t${round(myCurrentlyOwnedEuros, 2, true)}€`);
        } else if (isGoingUp) {
            log(`${dateAsString}\t${round(currentValue, 2, true)}€\t\x1b[32m↗\x1b[0m \t${round(myValueInEuros, 2, true)}€ \t${(myCurrentlyOwnedBitcoins + '').slice(0, 10)} BTC \t\t${round(myCurrentlyOwnedEuros, 2, true)}€`);
        } else {
            log(`${dateAsString}\t${round(currentValue, 2, true)}€\t \t${round(myValueInEuros, 2, true)}€ \t${(myCurrentlyOwnedBitcoins + '').slice(0, 10)} BTC \t\t${round(myCurrentlyOwnedEuros, 2, true)}€`);
        }
        history.push({
            value: currentValue,
            isGoingUp,
            isGoingDown,
            timestamp: (testDataPoint && testDataPoint.timestamp) ? testDataPoint.timestamp : Date.now()
        });
        intervalCounter++;
    }

    if (!data) { // no test data, run normally
        await func3();
        setInterval(() => {
            func3();
        }, settings.intervalPerTick);
    } else if (data) {
        try {
            let balance = await getBalance();
            const btcBefore = Number(balance.result.XXBT);
            let previousTimestamp;
            for (let i = 0; i < data.length; i++) {
                /* if (!previousTimestamp || (data[i].timestamp + (30000)) >= previousTimestamp) {
                    await func3(data[i]);
                    previousTimestamp = data[i].timestamp;
                } */
                await func3(data[i]);
            }
            await delay(3000);
            log('tradeHistory', tradeHistory);
            log('actions', actions);
            balance = await getBalance();
            log(balance);
            const btcNow = Number(balance.result.XXBT);

            log(`BTC change: ${(btcNow - btcBefore)} BTC`);
            const btcValueInEuros = Number(balance.result.XXBT) * Number(data.slice(-1)[0].value);
            log(`Balance total worth: ${round(Number(balance.result.ZEUR) + btcValueInEuros)}€`);

            testHistory.push({
                btcDiff: btcNow - btcBefore,
                xxbt: balance.result.XXBT,
                euros: balance.result.ZEUR,
                settings
            });

            return;
        } catch (err) {
            error(err);
        }
    }
}

const performSell = async (forceSell = false, hardCodedCurrentValue = null) => {
    if (!forceSell && actions.slice(-1)[0] === ACTIONS.HAS_SOLD) {
        warn('Aborting sell, bot has already sold before this, waiting to buy. Will not allow more than 1 sell in a row');
        return;
    }
    if (!forceSell && sellingIsInProgress) {
        warn('Aborting sell, a sell is already in progress');
        return;
    }
    sellingIsInProgress = true;

    let currentValue = hardCodedCurrentValue ? hardCodedCurrentValue : ((await kraken.api('Ticker', { pair: 'XXBTZEUR' })).result.XXBTZEUR.c[0]);
    let balance = await getBalance();
    let btcOwned = Number(balance.result.XXBT);
    let amount = forceSell ? btcOwned : settings.amountToSell * btcOwned; // Sell all if it's a forced trade

    log(`Sell ${ settings.amountToSell * 100 }% of current BTC owned (${amount})`);

    await sellBitcoin(amount, currentValue);

    priceWhenSold = currentValue;
    sellingIsInProgress = false;

    actions.push(ACTIONS.HAS_SOLD);

    logTrade(currentValue);

    return;
}

const logTrade = (currentValue) => {
    let newTrade;
    if (actions[actions.length - 1] === ACTIONS.HAS_BOUGHT && actions[actions.length - 2] === ACTIONS.HAS_SOLD) {
        // First sell then buy
        newTrade = {
            timestamp: Date.now(),
            priceWhenBought: priceWhenBought,
            priceWhenSold: currentValue,
            priceDiff: (priceWhenBought - priceWhenSold)
        };
        tradeHistory.push(newTrade);
    } else if (actions[actions.length - 1] === ACTIONS.HAS_SOLD && actions[actions.length - 2] === ACTIONS.HAS_BOUGHT) {
        // First buy then sell
        newTrade = {
            timestamp: Date.now(),
            priceWhenBought: priceWhenBought,
            priceWhenSold: priceWhenSold,
            priceDiff: (priceWhenSold - priceWhenBought)
        };
    }
    if (newTrade) {
        log('TRADE #' + (tradeHistory.length + 1));
        log(newTrade);
        tradeHistory.push(newTrade);
    }
}

const performBuy = async (forceBuy = false, hardCodedCurrentValue = null) => {
    if (!forceBuy && actions.slice(-1)[0] === ACTIONS.HAS_BOUGHT) { // last action was a buy
        warn('Has already bought previously, and is now waiting to sell');
        return;
    }

    let balance = await getBalance();
    let eurosOwned = Number(balance.result.ZEUR);

    if (eurosOwned === 0) {
        warn('Attempting to buy BTC but has no EUR in balance');
        return;
    }

    let currentValue = hardCodedCurrentValue ? hardCodedCurrentValue : ((await kraken.api('Ticker', { pair: 'XXBTZEUR' })).result.XXBTZEUR.c[0]);

    log(`Buy BTC for all available euros (${eurosOwned}€)`);

    await buyBitcoin(eurosOwned, currentValue);

    priceWhenBought = currentValue;
    actions.push(ACTIONS.HAS_BOUGHT);

    logTrade(currentValue);

    return;
}

const delay = (ms) =>
    new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, ms);
    });


const writeToLogFile = msg => {
    /* if (typeof msg === 'object') msg = JSON.stringify(msg, null, 4);
    fs.appendFile(fileName, `${msg}\n`, (err) => {
        if (err) {
            error(err);
        }
    }); */
}

const error = (...msg) => {
    console.error(...msg);
    writeToLogFile(msg);
}

const warn = (...msg) => {
    console.warn(...msg);
    writeToLogFile(msg);
}

const log = (...msg) => {
    console.log(...msg);
    writeToLogFile(msg);
}

(async () => {
    IS_SIMULATION = true;
    fileName = `logs/log_${Math.floor(Math.random() * 1000000)}.log`;

    if (!fs.existsSync('logs')) {
        fs.mkdirSync('logs');
    }

    fs.open(fileName, 'w', function (err, file) {
        if (err) throw err;
        log('Saved!');
    });
    //await delay(1000);
    const parameters = process.argv.filter(x => x.includes('=')).reduce((t, c) => {
        t[c.split('=')[0]] = c.split('=')[1];
        return t;
    }, {});

    if (IS_SIMULATION) {
        log('Starting Kraken daytrader in simulation mode, will not affect real wallet');
    }

    readline.emitKeypressEvents(process.stdin);
    if (process.stdin.isTTY) {
        process.stdin.setRawMode(true);
    }
    process.stdin.on('keypress', async (str, key) => {
        if (key.name === 'f11') { // SELL
            performSell();
        } else if (key.name === 'f10') { // BUY
            performBuy();
        } else if (key.name === 'f12') { // EXIT
            log('Exiting');
            console.log('testHistory', testHistory.filter(x => x.btcDiff > 0));
            process.exit();
        } else if (key.name === 'f9') { // EXIT
            log('Actions:');
            log(actions);
        } else if (key.name === 'f8') { // EXIT
            const balance = await getBalance();
            log(balance);
        } else if (key.name === 'f7') { // EXIT
            log(tradeHistory);
        }
    });
    await startInterval();
    /* const newlist = list.slice(-5000);
    var chance = new Chance();
    await startInterval(newlist); */
    /* for (var i = 0; i < 100; i++) {
        // RESET ALL
        intervalCounter = 0;
        actions = [];
        sellingIsInProgress = undefined;
        history = [];
        tradeHistory = [];
        priceWhenBought = undefined;
        priceWhenSold = undefined;
        SIMULATION_BALANCE = {
            error: [],
            result: {
                ALPHA: '0.00000',
                'EUR.HOLD': '0.0000',
                STORJ: '0.0000000000',
                USDT: '0.00000000',
                XCN: '230.3600',
                XXBT: '0.0041342600',
                XXMR: '0.0000000000',
                ZEUR: '0.00'
            }
        };
        settings.minSellChangePerc = chance.floating({ min: 0.85, max: 0.995 });
        settings.minBuyChangePerc = chance.floating({ min: 1.0098, max: 1.32 });
        await startInterval(newlist);
    } */
    //console.log('testHistory', testHistory.filter(x => x.btcDiff > 0));
})();