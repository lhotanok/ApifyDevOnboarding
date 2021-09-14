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

    const proxyConfiguration = await Apify.createProxyConfiguration({
        groups: ['BUYPROXIES94952'],
    });

    const crawler = new Apify.PuppeteerCrawler({
        maxRequestsPerCrawl: 100,
        maxConcurrency: 1,
        requestList,
        requestQueue,
        launchContext: {
            useChrome: true,
            stealth: true,
        },
        proxyConfiguration,
        useSessionPool: true,
        sessionPoolOptions: {
            maxPoolSize: 1, // single IP will be used by all browsers until it fails
            sessionOptions: {
                maxUsageCount: 5, // rotates the IP after 5 successful requests
            },
        },
        handlePageFunction: async (context) => {
            const { request, page, session } = context;
            const { url, userData: { label } } = request;

            log.info('Page opened.', { label, url });

            const title = await page.title();
            log.info(`Page title: ${title}`);

            if (title.toLowerCase().includes('sorry')) {
                session.retire();
                throw new Error('Page was blocked. Session retired.');
            } else if (title === 'Amazon.com') {
                session.retire();
                throw new Error('Captcha test was thrown.');
            }

            switch (label) {
                case 'OFFERS':
                    return handleOffers(context, result);
                case 'DETAIL':
                    return handleDetail(context, result);
                default:
                    return handleStart(context, requestQueue, result);
            }
        },
    });

    log.info('Starting the crawl.');

    await crawler.run();
    await saveResult();

    log.info('Crawl finished.');
});

async function saveResult() {
    const joinedResults = [];

    Object.keys(result).forEach((ASIN) => {
        const { detail, offers } = result[ASIN];

        joinedResults.push(...offers.map((offer) => {
            if (detail === {}) {
                detail.url = `https://www.amazon.com/dp/${ASIN}`;
            }
            return { ...detail, ...offer };
        }));
    });

    await Apify.pushData(joinedResults);
}
