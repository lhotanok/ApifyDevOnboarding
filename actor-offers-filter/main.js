const Apify = require('apify');

import fetch from 'node-fetch';

Apify.main(async () => {
    const input = await Apify.getInput();

    // Do something useful here...
    const cheapestOffers = [];

    const datasetID = input.resource.defaultDatasetId;
    const response = await fetch(`https://api.apify.com/v2/datasets/${datasetID}/items?`);
    const body = await response.text();

    await Apify.pushData(input);
    await Apify.pushData(body);
});
