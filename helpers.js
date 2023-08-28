/*
This function will get all the paramaters, both keys and values, that were present
when running this script. For instance if the user ran the command:

node index.js hey=1 lol=5 test=wzup

then this function will return:

[
  { key: 'hey': value: '1' },
  { key: 'lol': value: '5' },
  { key: 'test': value: 'wzup' }
]
*/
const getParamters = () => {
    return process.argv.map(x => {
        if (x.includes('=')) {
            return {
                name: x.split('=')[0],
                value: x.split('=')[1],
            };
        }
    }).filter(x => !!x); // filter out empty ones
}

const delay = ms => new Promise(resolve => {
    setTimeout(() => {
      resolve();
    }, ms);
  });

module.exports = {
    getParamters,
    delay
};