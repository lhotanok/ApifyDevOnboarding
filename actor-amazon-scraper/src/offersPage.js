const Apify = require('apify');

// eslint-disable-next-line no-unused-vars
const { Page } = require('puppeteer');

const { getElementInnerText, getElementsInnerTexts } = require('./pageEvaluator');

const { utils: { log } } = Apify;

/**
 *
 * @param {Object} context
 * @param {Apify.Request} context.request
 * @param {Page} context.page
 * @param {Object} state
 * @param {Object} state.saved
 */
exports.handleOffers = async ({ request, page }, state) => {
    const sellerNamesSelector = '#aod-offer-soldBy [aria-label]';
    await page.waitForSelector(sellerNamesSelector);

    const sellerNames = await getElementsInnerTexts(page, sellerNamesSelector);
    const prices = await scrapePrices(page);
    const shippingPrices = await scrapeShippingPrices(page);

    const { ASIN } = request.userData;

    // Amazon sometimes adds extra item for pinned offer
    while (sellerNames.length > prices.length) sellerNames.shift();

    // Initialize with 0 if no offers were scraped for this ASIN so far
    if (!state.saved[ASIN]) state.saved[ASIN] = 0;

    for (let i = 0; i < sellerNames.length; i++) {
        const sellerName = sellerNames[i];
        const price = prices[i];
        const shippingPrice = shippingPrices[i];
        const offerInfo = { sellerName, price, shippingPrice };

        const { detail } = request.userData;
        await Apify.pushData({ ...detail, ...offerInfo });
        state.saved[ASIN]++;

        log.info(`New offer scraped for product ASIN: ${ASIN}. ${JSON.stringify(offerInfo, null, 2)}`);
    }
};

/**
 *
 * @param {Page} page
 * @returns
 */
async function scrapePrices(page) {
    const priceSubSelector = '.a-price>.a-offscreen';
    const pinnedOfferPrice = await scrapePinnedOfferProperty(page, priceSubSelector);
    const otherOffersPrices = await scrapeNotPinnedOffersPriceProperties(page, [priceSubSelector]);

    const prices = [pinnedOfferPrice];
    otherOffersPrices.forEach((offerPrice) => prices.push(offerPrice));

    return prices;
}

/**
 *
 * @param {Page} page
 * @returns
 */
async function scrapeShippingPrices(page) {
    const pinnedOfferShippingPrice = await scrapePinnedOfferProperty(page,
        '> div:nth-child(3) > span > span');

    const otherOffersShippingPrices = await scrapeNotPinnedOffersPriceProperties(page,
        ['.a-fixed-right-grid-col.aod-padding-right-10.a-col-left > span > span',
            '#mir-layout-DELIVERY_BLOCK-slot-DELIVERY_MESSAGE']);

    const shippingPrices = [pinnedOfferShippingPrice];
    otherOffersShippingPrices.forEach((shippingPrice) => shippingPrices.push(shippingPrice));

    const parsedShippingPrices = shippingPrices.map((price) => {
        if (price) {
            const shippingInfoFragments = price.split(' ');
            for (const fragment of shippingInfoFragments) {
                if (fragment[0] === '$') { // check if fragment is price
                    return fragment;
                }
            }
        }

        return null;
    });

    return parsedShippingPrices;
}

/**
 *
 * @param {Page} page
 * @param {String} subSelector
 * @returns
 */
async function scrapePinnedOfferProperty(page, subSelector) {
    let pinnedOfferProperty = await getElementInnerText(page, `#aod-pinned-offer ${subSelector}`);

    if (!pinnedOfferProperty) {
        pinnedOfferProperty = await getElementInnerText(page, `#pinned-offer-top-id ${subSelector}`);
    }

    return pinnedOfferProperty;
}

/**
 *
 * @param {Page} page
 * @param {String[]} subSelectors
 * @returns {Promise<String[]>}
 */
async function scrapeNotPinnedOffersPriceProperties(page, subSelectors) {
    return page.evaluate((subSels) => {
        const priceProperties = [];

        document.querySelectorAll('#aod-offer-list #aod-offer ')
            .forEach((element) => {
                let property = null;
                for (let i = 0; i < subSels.length; i++) {
                    property = element.querySelector(subSels[i]);
                    if (property) break;
                }

                if (!property) priceProperties.push(property);
                else priceProperties.push(property.innerText);
            });

        return priceProperties;
    }, subSelectors);
}
