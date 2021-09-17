const Apify = require('apify');

// eslint-disable-next-line no-unused-vars
const { Page } = require('puppeteer');

const { getElementInnerText } = require('./pageEvaluator');

const { utils: { log } } = Apify;

/**
 *
 * @param {Object} context
 * @param {Apify.Request} context.request
 * @param {Page} context.page
 * @param {Apify.PuppeteerCrawler} context.crawler
 * @param {String} keyword
 */
exports.handleDetail = async ({ request, page, crawler }, keyword) => {
    const title = await getElementInnerText(page, '#productTitle');
    const description = await getElementInnerText(page, '#productDescription');

    const { url, userData: { ASIN } } = request;
    const { requestQueue } = crawler;

    const detail = { title, description, url, keyword };

    log.info(`New detail saved.
    Title: ${title}
    Url: ${url}
    Keyword: ${keyword}`);

    const offersRequest = {
        url: `https://www.amazon.com/gp/offer-listing/${ASIN}`,
        userData: { label: 'OFFERS', ASIN, detail },
    };

    await requestQueue.addRequest(offersRequest);
};
