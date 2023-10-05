module.exports = {
    /*
    Example setup:
    stocks: [
        {
            avanzaUrl: 'https://www.avanza.se/borshandlade-produkter/certifikat-torg/om-certifikatet.html/563966/bitcoin-xbt',
            // If transaction costs exists that indicates you have bought this stock previously
            // The different prices of each transaction should be listed in the transactionCosts array
            // In this example, the stock Bitcoin XBT was bought 3 times by the user, for the listed prices
            transactionCosts: [
                1296.49, 1355.32, 1425.88
            ]
        }, {
            // A stock that you wish to monitor but that you do not currently own
            avanzaUrl: 'https://www.avanza.se/aktier/om-aktien.html/399875/microstrategy-a'
        }
    ]
    */
    stocks: [
        {
            avanzaUrl: 'https://www.avanza.se/borshandlade-produkter/certifikat-torg/om-certifikatet.html/563966/bitcoin-xbt',
            transactionCosts: [
                1296.49
            ]
        }, {
            avanzaUrl: 'https://www.avanza.se/aktier/om-aktien.html/399875/microstrategy-a'
        }, {
            avanzaUrl: 'https://www.avanza.se/aktier/om-aktien.html/794954/riot-platforms',
            transactionCosts: [
                9.0884,
                9.0884,
                9.0884,
                9.0884,
                9.0884,
                9.0884
            ]
        }, {
            avanzaUrl: 'https://www.avanza.se/aktier/om-aktien.html/804473/marathon-digital'
        }, {
            avanzaUrl: 'https://www.avanza.se/aktier/om-aktien.html/1300923/bitfarms'
        }, {
            avanzaUrl: 'https://www.avanza.se/aktier/om-aktien.html/1247224/hut-8-mining'
        }, {
            avanzaUrl: 'https://www.avanza.se/aktier/om-aktien.html/3323/apple',
            transactionCosts: [
                172.9
            ]
        }, {
            avanzaUrl: 'https://www.avanza.se/aktier/om-aktien.html/3873/microsoft'
        }, {
            avanzaUrl: 'https://www.avanza.se/aktier/om-aktien.html/4478/nvidia'
        }, {
            avanzaUrl: 'https://www.avanza.se/aktier/om-aktien.html/238449/tesla'
        }, {
            avanzaUrl: 'https://www.avanza.se/aktier/om-aktien.html/5364/hennes---mauritz-b'
        }
    ]
}