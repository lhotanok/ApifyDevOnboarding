const Apify = require('apify');

const { utils: { log } } = Apify;

exports.handleStart = async ({ page, crawler }, result) => {
    log.info('Crawling start page');

    await page.waitForSelector('div[data-asin]');

    const ASINs = await page.$$eval('div[data-asin]',
        (elements) => elements.map((element) => element.getAttribute('data-asin'))
            .filter((ASIN) => ASIN !== '')); // keep non-empty ASINs only

    log.info(`Product ASINs from the first page: ${ASINs}`);

    ASINs.forEach((ASIN) => {
        result.ASINs[ASIN] = { offers: [] };
    });

    // const testASINs = [ASINs[0], ASINs[1], ASINs[2], ASINs[3]];
    // await enqueuePagesToScrape(testASINs, crawler.requestQueue);

    await enqueuePagesToScrape(ASINs, crawler.requestQueue);
};

/**
 *
 * @param {Array} productASINs
 * @param {Apify.RequestQueue} requestQueue
 */
async function enqueuePagesToScrape(productASINs, requestQueue) {
    productASINs.forEach(async (ASIN) => {
        const detailRequest = new Apify.Request({
            url: `https://www.amazon.com/dp/${ASIN}`,
            userData: { label: 'DETAIL', ASIN },
        });

        const offersRequest = new Apify.Request({
            url: `https://www.amazon.com/gp/offer-listing/${ASIN}`,
            userData: { label: 'OFFERS', ASIN },
        });

        await requestQueue.addRequest(detailRequest);
        await requestQueue.addRequest(offersRequest);
    });
}
