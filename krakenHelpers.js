const getAverages = (history, amountOfIntervals, ticksPerInterval) => {
    let intervals = [];

    let totalTicks = amountOfIntervals * ticksPerInterval;
    const slicedHistory = history.slice(-1 * totalTicks);

    for (let i = 0; i < amountOfIntervals; i++) {
        const interval = slicedHistory.slice(i * ticksPerInterval, (i + 1) * ticksPerInterval);
        intervals.push(interval);
    }
    const resp = intervals.map(x => x.reduce((t, c) => t += c.value, 0) / x.length);
    return resp;
};

const isMovingUp = (averagesInput, minPercentageNeeded) => {
    let movingDown = 0;
    averagesInput.forEach((x, i) => {
        const previousValue = averagesInput[i - 1];
        if (previousValue && (previousValue > x)) {
            movingDown++;
        }
    });
    return (movingDown / averagesInput.length) >= minPercentageNeeded;
}

const isMovingDown = (averagesInput, minPercentageNeeded) => {
    let movingUp = 0;
    averagesInput.forEach((x, i) => {
        const previousValue = averagesInput[i - 1];
        if (previousValue && (previousValue < x)) {
            movingUp++
        }
    });
    return (movingUp / averagesInput.length) >= minPercentageNeeded;
}

module.exports = {
    getAverages,
    isMovingDown,
    isMovingUp,
};