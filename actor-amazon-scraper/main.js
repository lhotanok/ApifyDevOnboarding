const Apify = require('apify');

const { handleStart } = require('./src/startPage');
const { handleDetail } = require('./src/detailPage');
const { handleOffers } = require('./src/offersPage');

const { utils: { log } } = Apify;

Apify.main(async () => {
    const { keyword } = await Apify.getInput();

    const state = await Apify.getValue('STATE') || { saved: {} };
    Apify.events.on('persistState', async () => Apify.setValue('STATE', state));
    setInterval(() => log.info(`Saved offers: ${JSON.stringify(state.saved, null, 2)}`), 20000);

    const startUrl = `https://www.amazon.com/s/ref=nb_sb_noss?url=search-alias%3Daps&field-keywords=${keyword}`;

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
                throw new Error('Captcha test was thrown. Session retired.');
            }

            switch (label) {
                case 'OFFERS':
                    return handleOffers(context, state);
                case 'DETAIL':
                    return handleDetail(context, keyword);
                default:
                    return handleStart(context);
            }
        },
    });

    log.info('Starting the crawl.');
    await crawler.run();
    log.info('Crawl finished.');
});
