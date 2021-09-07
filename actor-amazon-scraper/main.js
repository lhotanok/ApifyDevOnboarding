const Apify = require('apify');
const { handleStart } = require('./src/startPage');
const { handleDetail } = require('./src/detailPage');
const { handleOffers } = require('./src/offersPage');

const { utils: { log } } = Apify;
const result = {};

Apify.main(async () => {
    const input = await Apify.getInput();
    const startUrl = `https://www.amazon.com/s/ref=nb_sb_noss?url=search-alias%3Daps&field-keywords=${input.keyword}`;

    const requestList = await Apify.openRequestList('start-url', [startUrl]);
    const requestQueue = await Apify.openRequestQueue();

    const crawler = new Apify.PuppeteerCrawler({
        maxRequestsPerCrawl: 100,
        requestList,
        requestQueue,
        launchContext: {
            useChrome: true,
            stealth: true,
        },
        handlePageFunction: async (context) => {
            const { url, userData: { label } } = context.request;

            log.info('Page opened.', { label, url });

            switch (label) {
                case 'OFFERS':
                    return handleOffers(context, result);
                case 'DETAIL':
                    return handleDetail(context, result);
                default:
                    return handleStart(context, requestQueue);
            }
        },
    });

    log.info('Starting the crawl.');
    await crawler.run();
    log.info('Crawl finished.');
});