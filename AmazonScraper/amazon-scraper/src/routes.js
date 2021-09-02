const Apify = require('apify');

const { utils: { log } } = Apify;

exports.handleStart = async ({ page }, requestQueue) => {
    log.info('Crawling start page');

    await page.waitForSelector('div[data-asin]');

    const productASINs = await page.evaluate(() => {
        const ASINs = [];

        const elements = document.querySelectorAll('div[data-asin]');
        elements.forEach((element) => {
            const ASIN = element.getAttribute('data-asin');
            if (ASIN !== '') ASINs.push(ASIN);
        });

        return ASINs;
    });

    log.info(`Product ASINs: ${productASINs}`);
    await enqueuePagesToScrape(productASINs, requestQueue);
};

exports.handleOffers = async ({ request, page }, result) => {
    const sellerName = await getElementInnerText(page, '#sellerProfileTriggerId');
    const price = await getElementInnerText(page, '#price_inside_buybox');
    const shippingPrice = await getShippingPrice(page);

    const { ASIN } = request.userData;

    const detailResult = { ...result[ASIN] };
    const offerResult = { sellerName, price, shippingPrice };

    const joinedResult = {
        ...detailResult,
        ...offerResult,
    };

    log.info('Joined result is: ');
    log.info(`Title: ${joinedResult.title}, Description: ${joinedResult.description}, Url: ${joinedResult.url}`);
    log.info(`Seller name: ${joinedResult.sellerName}, Price: ${joinedResult.price}, Shipping: ${joinedResult.shippingPrice}`);

    result[ASIN].offers.push(joinedResult);
    await Apify.pushData(joinedResult);
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
    Description: ${result[ASIN].description},
    Url: ${result[ASIN].url},
    Keyword: ${result[ASIN].keyword}`);
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
    return page.$eval(selector, (el) => el.innerText);
}

async function getShippingPrice(page) {
    const shippingInfo = await getElementInnerText(page, '#ourprice_shippingmessage>span.a-size-base');
    log.info(`Shipping info: ${shippingInfo}`);

    if (shippingInfo === null || shippingInfo.length === 0) return null;

    const fragments = shippingInfo.split(' ');
    const shippingKeywordIndex = fragments.indexOf('Shipping');
    const shippingPriceIndex = shippingKeywordIndex - 1;

    if (shippingPriceIndex < fragments.length) return null;

    return fragments[shippingPriceIndex];
}
