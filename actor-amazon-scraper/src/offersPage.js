const Apify = require('apify');
const { getElementInnerText, getElementsInnerTexts } = require('./pageEvaluator');

const { saveSnapshot } = Apify.utils.puppeteer;
const { utils: { log } } = Apify;

exports.handleOffers = async ({ request, page }, result) => {
    const sellerNamesSelector = '#aod-offer-soldBy [aria-label]';
    await page.waitForSelector(sellerNamesSelector);

    const sellerNames = await getElementsInnerTexts(page, sellerNamesSelector);
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

        await saveOfferToDatalist(detailResult, { sellerName, price, shippingPrice });
    }

    await saveSnapshot(page, { key: `test-screen-${ASIN}` });
};

async function saveOfferToDatalist(detailResult, offerResult) {
    const joinedResult = {
        ...detailResult,
        ...offerResult,
    };

    await Apify.pushData(joinedResult);

    log.info('New offer scraped: ');
    log.info(`Title: ${joinedResult.title}, Url: ${joinedResult.url}`);
    log.info(`Seller name: ${joinedResult.sellerName}, Price: ${joinedResult.price}, Shipping: ${joinedResult.shippingPrice}`);
}

async function scrapePrices(page) {
    const priceSubSelector = '.a-price>.a-offscreen';
    const pinnedOfferPrice = await scrapePinnedOfferProperty(page, priceSubSelector);
    const otherOffersPrices = await scrapeNotPinnedOffersPriceProperties(page, [priceSubSelector]);

    const prices = [pinnedOfferPrice];
    otherOffersPrices.forEach((offerPrice) => prices.push(offerPrice));

    return prices;
}

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

async function scrapePinnedOfferProperty(page, subSelector) {
    let pinnedOfferProperty = await getElementInnerText(page, `#aod-pinned-offer ${subSelector}`);

    if (!pinnedOfferProperty) {
        pinnedOfferProperty = await getElementInnerText(page, `#pinned-offer-top-id ${subSelector}`);
    }

    return pinnedOfferProperty;
}

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
