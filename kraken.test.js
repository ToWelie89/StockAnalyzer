const { getAverages, isMovingDown, isMovingUp } = require('./krakenHelpers');

describe('getAverages', () => {
    const history = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    test('get correct averages', () => {
        const res = getAverages(history, 3, 3);
        /*
            1 + 2 + 3 = 6 / 3 = 2
            4 + 5 + 6 = 15 / 3 = 5
            7 + 8 + 9 = 24 / 3 = 8
        */
        expect(res).toStrictEqual([2, 5, 8]);
    });
});

describe('isMovingDown', () => {
    test('should be moving up 1', () => {
        const avgs = [2, 5, 8];
        expect(isMovingUp(avgs)).toBe(true);
    });
    test('should be moving up 2', () => {
        const avgs = [2, 5, 8, 8, 10, 100];
        expect(isMovingUp(avgs)).toBe(true);
    });
    test('is not constantly moving up', () => {
        const avgs = [2, 5, 8, 7, 9];
        expect(isMovingUp(avgs)).toBe(false);
    });
});
describe('isMovingDown', () => {
    test('should be moving up 1', () => {
        const avgs = [6, 6, 4, 1];
        expect(isMovingDown(avgs)).toBe(true);
    });
    test('should be moving up 2', () => {
        const avgs = [100, 100, 33, 21, 20, 10];
        expect(isMovingDown(avgs)).toBe(true);
    });
    test('is not constantly moving down', () => {
        const avgs = [10, 9, 8, 9, 4, 1];
        expect(isMovingDown(avgs)).toBe(false);
    });
});
