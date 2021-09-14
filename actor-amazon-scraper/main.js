const Apify = require('apify');

// eslint-disable-next-line no-unused-vars
const { Page, HTTPResponse } = require('puppeteer');

const { handleStart } = require('./src/startPage');
const { handleDetail } = require('./src/detailPage');
const { handleOffers } = require('./src/offersPage');

const { utils: { log } } = Apify;
const result = {};

Apify.main(async () => {
    const input = await Apify.getInput();
    const state = await Apify.getValue('STATE');
    result.saved = state ? state.saved : {};
    result.ASINs = state ? state.ASINs : {};
    
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
        handlePageFunction,
    });

    setInterval(() => log.info(`Saved offers: ${JSON.stringify(result.saved)}`), 20000);

    Apify.events.on('migrating', () => persistStateAndAbort(requestList));
    Apify.events.on('aborting', () => persistStateAndAbort(requestList));

    log.info('Starting the crawl.');

    await crawler.run();
    await saveBufferedOffers();

    log.info('Crawl finished.');
});

/**
 *
 * @param {Object} context Request context
 * @param {Apify.Request} context.request
 * @param {HTTPResponse} context.response
 * @param {Page} context.page
 * @param {Apify.Session} context.session
 * @param {Apify.BrowserController} context.browserController
 * @param {Apify.ProxyInfo} context.proxyInfo
 * @param {Apify.PuppeteerCrawler} context.crawler
 * @returns
 */
async function handlePageFunction(context) {
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
            return handleStart(context, result);
    }
}

/**
 * Is designed for cases when product detail page was scraped
 * after the corresponding offers page (e.g. error was thrown
 * while crawling detail page)
 */
async function saveBufferedOffers() {
    const joinedResults = [];

    Object.keys(result.ASINs).forEach((ASIN) => {
        const { detail, offers } = result.ASINs[ASIN];

        joinedResults.push(...offers.map((offer) => {
            if (detail === {}) {
                // detail pages was not scraped successfully, store at least product's url
                detail.url = `https://www.amazon.com/dp/${ASIN}`;
            }
            return { ...detail, ...offer };
        }));
    });

    await Apify.pushData(joinedResults);
}

/**
 *
 * @param {Apify.RequestList} requestList
 */
async function persistStateAndAbort(requestList) {
    await Apify.setValue('STATE', result);
    await requestList.persistState();

    process.exit(91); // to speed up abort
}
