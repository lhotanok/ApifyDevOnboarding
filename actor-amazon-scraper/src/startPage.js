const Apify = require('apify');

const { utils: { log } } = Apify;

exports.handleStart = async ({ page, crawler }) => {
    log.info('Crawling start page');

    await page.waitForSelector('div[data-asin]');

    const ASINs = await page.$$eval('div[data-asin]',
        (elements) => elements.map((element) => element.getAttribute('data-asin'))
            .filter((ASIN) => ASIN !== '')); // keep non-empty ASINs only

    log.info(`Product ASINs from the first page: ${ASINs}`);

    const testASINs = [ASINs[0], ASINs[1], ASINs[2], ASINs[3]];
    await enqueuePagesToScrape(testASINs, crawler.requestQueue);

    // await enqueuePagesToScrape(ASINs, crawler.requestQueue);
};

/**
 *
 * @param {Array} productASINs
 * @param {Apify.RequestQueue} requestQueue
 */
async function enqueuePagesToScrape(productASINs, requestQueue) {
    for (const ASIN of productASINs) {
        const detailRequest = {
            url: `https://www.amazon.com/dp/${ASIN}`,
            userData: { label: 'DETAIL', ASIN },
        };

        await requestQueue.addRequest(detailRequest);
    }
}
