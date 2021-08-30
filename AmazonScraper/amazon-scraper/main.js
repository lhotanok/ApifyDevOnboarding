const Apify = require('apify');
const { handleStart, handleList: handleOffers, handleDetail } = require('./src/routes');

const { utils: { log } } = Apify;

Apify.main(async () => {
    const input = await Apify.getInput();
    const startUrl = `https://www.amazon.com/s/ref=nb_sb_noss?url=search-alias%3Daps&field-keywords=${input.keyword}`;

    const requestList = await Apify.openRequestList('start-url', [startUrl]);
    const requestQueue = await Apify.openRequestQueue();
    // const proxyConfiguration = await Apify.createProxyConfiguration();

    const crawler = new Apify.PuppeteerCrawler({
        maxRequestsPerCrawl: 50,
        requestList,
        requestQueue,
        // proxyConfiguration,
        launchContext: {
            useChrome: true,
            stealth: true,
        },
        handlePageFunction: async (context) => {
            const { url, userData: { label } } = context.request;
            log.info('Page opened.', { label, url });
            switch (label) {
                case 'OFFERS':
                    return handleOffers(context);
                case 'DETAIL':
                    return handleDetail(context);
                default:
                    return handleStart(context, requestQueue);
            }
        },
    });

    log.info('Starting the crawl.');
    await crawler.run();
    log.info('Crawl finished.');
});
