const Apify = require('apify');
const { getElementInnerText } = require('./pageEvaluator');

const { utils: { log } } = Apify;

exports.handleDetail = async ({ request, page }, result) => {
    const title = await getElementInnerText(page, '#productTitle');
    const description = await getElementInnerText(page, '#productDescription');

    const input = await Apify.getInput();
    const { keyword } = input;

    const { url } = request;
    const { ASIN } = request.userData;

    result[ASIN].detail = { title, description, url, keyword };

    log.info(`New detail saved.
    Title: ${title},
    Url: ${url},
    Keyword: ${keyword}`);
};
