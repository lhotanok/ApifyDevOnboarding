const Apify = require('apify');

const { utils: { log } } = Apify;

exports.handleStart = async ({ page }, requestQueue) => {
    log.info('Crawling start page');
    await page.waitForSelector('div[data-asin]');

    const ASINs = await page.$$eval('div[data-asin]',
        (elements) => elements.map((element) => element.getAttribute('data-asin'))
            .filter((ASIN) => ASIN !== ''));

    log.info(`ASINs: ${ASINs}`);
    await enqueuePagesToScrape(ASINs, requestQueue);
};

exports.handleDetail = async ({ request, page }, result) => {
    log.info('Crawling detail page');

    const title = await getElementInnerText(page, '#productTitle');
    const description = await getElementInnerText(page, '#productDescription');

    const input = await Apify.getInput();
    const { keyword } = input;

    const { url } = request;
    const { ASIN } = request.userData;

    result[ASIN] = { title, description, url, keyword };

    log.info(`New detail saved. Title: ${result[ASIN].title},
    Url: ${result[ASIN].url},
    Keyword: ${result[ASIN].keyword}`);
};

exports.handleOffers = async ({ request, page }, result) => {
    await page.waitForSelector('#aod-offer-soldBy [aria-label]');

    const sellerNames = await getElementsInnerTexts(page, '#aod-offer-soldBy [aria-label]');
    const prices = await scrapePrices(page);
    log.info(`Sellers: ${sellerNames}`);
    log.info(`Prices: ${prices}`);

    const { ASIN } = request.userData;
    const detailResult = { ...result[ASIN] };

    for (let i = prices.length - 1; i >= 0; i--) {
        const sellerName = sellerNames[i];
        const price = prices[i];
        const offerResult = { sellerName, price };

        const joinedResult = {
            ...detailResult,
            ...offerResult,
        };

        log.info('New offer scraped: ');
        log.info(`Title: ${joinedResult.title}, Url: ${joinedResult.url}`);
        log.info(`Seller name: ${joinedResult.sellerName}, Price: ${joinedResult.price}, Shipping: ${joinedResult.shippingPrice}`);

        await Apify.pushData(joinedResult);
    }
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

async function getElementInnerText(page, selector) {
    return page.evaluate((sel) => {
        const element = document.querySelector(sel);
        return element ? element.innerText.trim() : '';
    }, selector);
}

async function getElementsInnerTexts(page, selector) {
    return page.evaluate((sel) => [...document.querySelectorAll(sel)]
        .map((element) => element.innerText.trim()), selector);
}

async function scrapePrices(page) {
    let pinnedOfferPrice = await getElementInnerText(page, '#aod-pinned-offer .a-price>.a-offscreen');
    if (!pinnedOfferPrice) pinnedOfferPrice = await getElementInnerText(page, '#pinned-offer-top-id .a-price>.a-offscreen');

    const otherOffersPrices = await getElementsInnerTexts(page, '#aod-offer-price .a-price>.a-offscreen');

    const prices = [pinnedOfferPrice];
    otherOffersPrices.forEach((offerPrice) => prices.push(offerPrice));

    return prices;
}
