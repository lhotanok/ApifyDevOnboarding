import fetch from 'node-fetch';
import Apify from 'apify';

const { utils: { log } } = Apify;

Apify.main(async () => {
    const input = await Apify.getInput();

    const datasetID = input.resource.defaultDatasetId;
    const response = await fetch(`https://api.apify.com/v2/datasets/${datasetID}/items?`);
    const offers = await response.json();

    log.info(`Dataset ID is: ${datasetID}`);
    
    log.info('Start filtering cheapest offers.');
    const cheapestOffers = getCheapestOffers(offers);

    await Apify.pushData(cheapestOffers);
    log.info('Saved cheapest offers into default dataset.');
});

function getCheapestOffers(offers) {
    const cheapestOffers = {};

    offers.forEach((offer) => {
        const offerUrlFragments = offer.url.split('/');
        const offerASIN = offerUrlFragments[offerUrlFragments.length - 1];

        if (!cheapestOffers[offerASIN]) {
            cheapestOffers[offerASIN] = offer;
        } else {
            cheapestOffers[offerASIN] = getCheaperOffer(cheapestOffers[offerASIN], offer);
        }
    });

    return Object.values(cheapestOffers);
}

function getCheaperOffer(firstOffer, secondOffer) {
    const firstOfferPrice = getParsedPrice(firstOffer.price);
    const firstOfferShippingPrice = getParsedPrice(firstOffer.shippingPrice);

    const secondOfferPrice = getParsedPrice(secondOffer.price);
    const secondOfferShippingPrice = getParsedPrice(secondOffer.shippingPrice);

    if (firstOfferPrice + firstOfferShippingPrice <= secondOfferPrice + secondOfferShippingPrice) {
        return firstOffer;
    }

    return secondOffer;
}

function getParsedPrice(price) {
    return price ? parseFloat(price.substring(1)) : 0;
}