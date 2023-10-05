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
            avanzaUrl: 'https://www.avanza.se/borshandlade-produkter/certifikat-torg/om-certifikatet.html/563966/bitcoin-xbt'
        }, {
            avanzaUrl: 'https://www.avanza.se/aktier/om-aktien.html/399875/microstrategy-a'
        }, {
            avanzaUrl: 'https://www.avanza.se/aktier/om-aktien.html/794954/riot-platforms'
        }, {
            avanzaUrl: 'https://www.avanza.se/aktier/om-aktien.html/804473/marathon-digital'
        }, {
            avanzaUrl: 'https://www.avanza.se/aktier/om-aktien.html/1300923/bitfarms',
            transactionCosts: [
                0.85,
                0.81,
                0.91
            ]
        }, {
            avanzaUrl: 'https://www.avanza.se/aktier/om-aktien.html/1247224/hut-8-mining'
        }, {
            avanzaUrl: 'https://www.avanza.se/aktier/om-aktien.html/3323/apple'
        }, {
            avanzaUrl: 'https://www.avanza.se/aktier/om-aktien.html/3873/microsoft'
        }, {
            avanzaUrl: 'https://www.avanza.se/aktier/om-aktien.html/4478/nvidia',
            transactionCosts: [
                220.34,
                290.32,
                345.13,
                400.01
            ]
        }, {
            avanzaUrl: 'https://www.avanza.se/aktier/om-aktien.html/238449/tesla'
        }, {
            avanzaUrl: 'https://www.avanza.se/aktier/om-aktien.html/1200240/coinshares-international'
        }, {
            avanzaUrl: 'https://www.avanza.se/aktier/om-aktien.html/645576/infant-bacterial-therapeuticsb'
        }
    ]
}