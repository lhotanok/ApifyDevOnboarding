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

    log.info(`New detail saved.
    Title: ${result[ASIN].title},
    Url: ${result[ASIN].url},
    Keyword: ${result[ASIN].keyword}`);
};

exports.handleOffers = async ({ request, page }, result) => {
    await page.waitForSelector('#aod-offer-soldBy [aria-label]');

    const sellerNames = await getElementsInnerTexts(page, '#aod-offer-soldBy [aria-label]');
    const prices = await scrapePrices(page);
    const shippingPrices = await scrapeShippingPrices(page);

    const { ASIN } = request.userData;
    const detailResult = { ...result[ASIN] };

    // Amazon sometimes adds extra item for pinned offer
    while (sellerNames.length > prices.length) sellerNames.shift();

    for (let i = 0; i < sellerNames.length; i++) {
        const sellerName = sellerNames[i];
        const price = prices[i];
        const shippingPrice = shippingPrices[i];

        const offerResult = { sellerName, price, shippingPrice };

        const joinedResult = {
            ...detailResult,
            ...offerResult,
        };

        await Apify.pushData(joinedResult);

        log.info('New offer scraped: ');
        log.info(`Title: ${joinedResult.title}, Url: ${joinedResult.url}`);
        log.info(`Seller name: ${joinedResult.sellerName}, Price: ${joinedResult.price}, Shipping: ${joinedResult.shippingPrice}`);
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
        return element ? element.innerText.trim() : null;
    }, selector);
}

async function getElementsInnerTexts(page, selector) {
    return page.evaluate((sel) => [...document.querySelectorAll(sel)]
        .map((element) => element.innerText.trim()), selector);
}

async function scrapePrices(page) {
    const priceSubSelector = '.a-price>.a-offscreen';
    const pinnedOfferPrice = await scrapePinnedOfferProperty(page, priceSubSelector);
    const otherOffersPrices = await scrapeNotPinnedOffersPriceProperties(page, priceSubSelector);

    const prices = [pinnedOfferPrice];
    otherOffersPrices.forEach((offerPrice) => prices.push(offerPrice));

    return prices;
}

async function scrapeShippingPrices(page) {
    const pinnedOfferShippingPrice = await scrapePinnedOfferProperty(page, '> div:nth-child(3) > span > span');

    const otherOffersShippingPrices = await scrapeNotPinnedOffersPriceProperties(page,
        '.a-fixed-right-grid-col.aod-padding-right-10.a-col-left > span > span');

    const shippingPrices = [pinnedOfferShippingPrice];
    otherOffersShippingPrices.forEach((shippingPrice) => shippingPrices.push(shippingPrice));

    return shippingPrices.map((price) => {
        if (!price) return price;
        return price.split(' ')[1];
    });
}

async function scrapePinnedOfferProperty(page, subSelector) {
    let pinnedOfferProperty = await getElementInnerText(page, `#aod-pinned-offer ${subSelector}`);
    if (!pinnedOfferProperty) {
        pinnedOfferProperty = await getElementInnerText(page, `#pinned-offer-top-id ${subSelector}`);
    }

    return pinnedOfferProperty;
}

async function scrapeNotPinnedOffersPriceProperties(page, subSelector) {
    return page.evaluate((subSel) => {
        const priceProperties = [];

        document.querySelectorAll('#aod-offer-list #aod-offer').forEach((element) => {
            const property = element.querySelector(subSel);
            if (!property) priceProperties.push(property);
            else priceProperties.push(property.innerText);
        });

        return priceProperties;
    }, subSelector);
}
