const Apify = require('apify');

const { utils: { log } } = Apify;

exports.handleStart = async ({ page }, requestQueue) => {
    log.info('Crawling start page');

    await page.waitForSelector('div[data-asin]');

    const productASINs = await page.evaluate(() => {
        const ASINs = [];

        const elements = document.querySelectorAll('div[data-asin]');
        elements.forEach((element) => {
            const ASIN = element.getAttributeNode('data-asin').value;
            if (ASIN !== '') ASINs.push(ASIN);
        });

        return ASINs;
    });

    log.info(`Product ASINs: ${productASINs}`);
    await enqueueDetailPages(productASINs, requestQueue);
};

exports.handleOffers = async ({ request, page }) => {

};

exports.handleDetail = async ({ request, page }) => {

};

/**
 *
 * @param {Array} productASINs
 * @param {Apify.RequestQueue} requestQueue
 */
async function enqueueDetailPages(productASINs, requestQueue) {
    productASINs.forEach(async (ASIN) => {
        const request = new Apify.Request({
            url: `https://www.amazon.com/dp/${ASIN}`,
            userData: { label: 'DETAIL' },
        });

        await requestQueue.addRequest(request);
    });
}
