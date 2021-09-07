const Apify = require('apify');

Apify.main(async () => {
    const input = await Apify.getInput();
    console.log('Input:');
    console.dir(input);

    // Do something useful here...
    const cheapestOffers = [];


    await Apify.pushData(input);
});
