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
 * @param {Object} result
 * @param {Object} result.saved
 * @param {Object} result.ASINs
 */
exports.handleDetail = async ({ request, page }, result) => {
    const title = await getElementInnerText(page, '#productTitle');
    const description = await getElementInnerText(page, '#productDescription');

    const input = await Apify.getInput();
    const { keyword } = input;

    const { url } = request;
    const { ASIN } = request.userData;

    result.ASINs[ASIN].detail = { title, description, url, keyword };

    log.info(`New detail saved.
    Title: ${title},
    Url: ${url},
    Keyword: ${keyword}`);
};
