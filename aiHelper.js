//import { ChatGPTAPI } from 'chatgpt';

const OpenAI = require("openai");
require('dotenv').config();

const performAIRequest = async text => {
    if (!process.env.CHATGPT_KEY) {
        return;
    }
    try {
        const openAi = new OpenAI({
            apiKey: process.env.CHATGPT_KEY
        });
        const msg = await openAi.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: 'user', content: text }]
        });
        return msg;
    } catch (err) {
        console.error(err);
        if (err.statusCode === 401) {
            console.log('API KEY FOR CHATGPT EXPIRED');
            // Unauthorized error, api-key expired most likely, check https://platform.openai.com/account/api-keys
            // Send mail
        }
        console.log('ChatGPT API ERROR', err);
    }
}

const getDescriptionOfOwnedStocks = async stocks => {
    let text = '';
    for (let i = 0; i < stocks.length; i++) {
        const data = stocks[i];
        text += ` Now let's lock at the stock that I own called ${data.name}, which I own ${data.amount} of.`;
        if (data.oneDayChange) {
            text += ` ${data.name} has changed by a percentage of ${data.oneDayChange}% since tomorrow.`;
        }
        if (data.oneWeekChange) {
            text += ` ${data.name} has changed by a percentage of ${data.oneWeekChange}% since last week.`;
        }
        if (data.oneMonthChange) {
            text += ` ${data.name} has changed by a percentage of ${data.oneMonthChange}% since last month.`;
        }
        if (data.threeMonthsChange) {
            text += ` ${data.name} has changed by a percentage of ${data.threeMonthsChange}% since 3 months ago.`;
        }
        if (data.thisYearChange) {
            text += ` ${data.name} has changed by a percentage of ${data.thisYearChange}% since the start of this year.`;
        }
        if (data.oneYearChange) {
            text += ` ${data.name} has changed by a percentage of ${data.oneYearChange}% since 12 months ago.`;
        }
        if (data.threeYearsChange) {
            text += ` ${data.name} has changed by a percentage of ${data.threeYearsChange}% since 3 years ago.`;
        }
        if (data.fiveYearsChange) {
            text += ` ${data.name} has changed by a percentage of ${data.fiveYearsChange}% since 5 years ago.`;
        }
        text += ` In total I have invested ${data.totalMoneySpent} ${data.currency} in ${data.amount === 1 ? '1 stock' : 'several stocks'} for ${data.name}, currently worth ${data.totalCurrentWorth} ${data.currency} if I were to sell them today. `;
        if (data.profitEarnedSEK > 0) {
            text += ` This amounts to a profit of a ${data.profitEarnedSEK} ${data.currency} for ${data.name}, which translates to ${data.diffPercent} increase. `;
        } else {
            text += ` This amounts to a loss of a ${data.profitEarnedSEK} ${data.currency} for ${data.name}, which translates to ${data.diffPercent} decrease. `;
        }
    }
    /* const exampleResponse = {
        "id": "chatcmpl-865iSB3NR77MCCrvjSnikKBIsc0LZ",
        "object":
        "chat.completion",
        "created": 1696462632,
        "model": "gpt-3.5-turbo-0613",
        "choices": [{
            "index": 0,
            "message": {
                "role": "assistant",
                "content": "I own stocks in BITCOIN XBT, Riot Platforms, and Apple. BITCOIN XBT has experienced various changes in percentage over different time periods, with an overall profit of 81.51 SEK. Riot Platforms has seen both increases and decreases, resulting in a small loss of -0.11 USD. Apple has also experienced changes in percentage, resulting in a profit of 0.76 USD."
            },
            "finish_reason": "stop"
        }],
        "usage": {
            "prompt_tokens": 741,
            "completion_tokens": 84,
            "total_tokens": 825
        }
    } */
    const response = await performAIRequest(`Can you please formulate a summary in words, do not just repeat numbers, with maximum 300 characters, from the following text that details the development of stocks that I own, also try to determine which stocks are worth to continue investing in: ${text}`);
    return (response && response.choices && response.choices[0] && response.choices[0].message && response.choices[0].message.content)
        ? response.choices[0].message.content
        : 'N/A';
}

const getDescriptionOfNonOwnedStocks = async stocks => {
    let text = 'This is a summary of stocks that I am currently tracking but have not invested in yet. ';
    for (let i = 0; i < stocks.length; i++) {
        const data = stocks[i];
        text += ` Now let's lock at the stock called ${data.name}.`;
        if (data.oneDayChange) {
            text += ` ${data.name} has changed by a percentage of ${data.oneDayChange}% since tomorrow.`;
        }
        if (data.oneWeekChange) {
            text += ` ${data.name} has changed by a percentage of ${data.oneWeekChange}% since last week.`;
        }
        if (data.oneMonthChange) {
            text += ` ${data.name} has changed by a percentage of ${data.oneMonthChange}% since last month.`;
        }
        if (data.threeMonthsChange) {
            text += ` ${data.name} has changed by a percentage of ${data.threeMonthsChange}% since 3 months ago.`;
        }
        if (data.thisYearChange) {
            text += ` ${data.name} has changed by a percentage of ${data.thisYearChange}% since the start of this year.`;
        }
        if (data.oneYearChange) {
            text += ` ${data.name} has changed by a percentage of ${data.oneYearChange}% since 12 months ago.`;
        }
        if (data.threeYearsChange) {
            text += ` ${data.name} has changed by a percentage of ${data.threeYearsChange}% since 3 years ago.`;
        }
        if (data.fiveYearsChange) {
            text += ` ${data.name} has changed by a percentage of ${data.fiveYearsChange}% since 5 years ago.`;
        }
    }

    const response = await performAIRequest(`Can you please formulate a summary in words, do not just repeat numbers, with maximum 300 characters, from the following text that details the development of stocks that I am tracking but do not own, also try to suggest which ones would be best to invest in: ${text}`);
    return (response && response.choices && response.choices[0] && response.choices[0].message && response.choices[0].message.content)
        ? response.choices[0].message.content
        : 'N/A';
}

module.exports = {
    getDescriptionOfOwnedStocks,
    getDescriptionOfNonOwnedStocks
};