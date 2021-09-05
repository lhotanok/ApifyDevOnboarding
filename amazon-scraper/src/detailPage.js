const Apify = require('apify');
const { getElementInnerText } = require('./pageEvaluator');

const { utils: { log } } = Apify;

exports.handleDetail = async ({ request, page }, result) => {
    log.info('Crawling detail page');

    const title = await getElementInnerText(page, '#productTitle');
    const description = await getElementInnerText(page, '#productDescription');

    const input = await Apify.getInput();
    const { keyword } = input;

    const { url } = request;
    const { ASIN } = request.userData;

    result[ASIN] = { title, description, url, keyword };

    log.info(`New detail saved.
    Title: ${result[ASIN].title},
    Url: ${result[ASIN].url},
    Keyword: ${result[ASIN].keyword}`);
};
