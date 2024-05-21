const fs = require("fs");
const readline = require('readline');

async function processLineByLine() {
    const fileStream = fs.createReadStream('./btceuro.csv');

    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });
    // Note: we use the crlfDelay option to recognize all instances of CR LF
    // ('\r\n') in input.txt as a single line break.
    let counter = 0;
    let previousTimestamp;

    for await (const line of rl) {
        // Each line in input.txt will be successively available here as `line`.
        if (counter % 5 === 0) { // every 30 seconds
            // 1678151695,21051.30000,0.36065494
            let timestamp = line.split(',')[0].trim();
            timestamp = timestamp * 1000;

            const diff = previousTimestamp ? ((new Date(timestamp).getTime() - new Date(previousTimestamp).getTime()) / 1000) : null;

            if (!previousTimestamp || (diff && diff >= 30)) {
                let value = line.split(',')[1].trim();
                fs.appendFileSync('historicaldata.js', `\t\t{ timestamp: ${timestamp}, value: ${Number(value)} },\n`);
    
                previousTimestamp = timestamp;
                console.log('Wrote to file', value);
            }
        }
        counter++;
    }
    fs.appendFileSync('historicaldata.js', `\t]`);
    fs.appendFileSync('historicaldata.js', `};`);
}

fs.open('historicaldata.js', 'w', function (err, file) {
    if (err) throw err;

    console.log('Created log file');
    fs.appendFileSync('historicaldata.js', `module.exports = {`);
    fs.appendFileSync('historicaldata.js', `\tlist: [`);

    processLineByLine();
});
