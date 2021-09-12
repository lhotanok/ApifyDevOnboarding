import Apify, { main, getInput, setValue } from 'apify';
import ApifyClient from 'apify-client';
import fetch from 'node-fetch';
import { URLSearchParams } from 'url';

const { utils: { log } } = Apify;

main(async () => {
    const input = await getInput();
    const { useClient } = input;

    const taskName = 'lhotanok~laptop-search-task';

    const items = useClient ? await getTaskRunResultUsingClient(taskName, input)
        : await getTaskRunResultUsingApi(taskName, input);

    log.info(`Output items: ${items}`);

    // sets .csv extension automatically (works locally but not on Apify platform)
    // if called with 'OUTPUT.csv' parameter locally, OUTPUT.csv.csv is created 👀
    await setValue('OUTPUT.csv', items, { contentType: 'text/csv' });

    log.info('Export finished.');
});

/**
 * @param {String} taskId Task id or unique name
 * @param {Object} input Input object for task run configuration
 * @returns {String} Dataset items in csv text format
 */
async function getTaskRunResultUsingApi(taskId, input) {
    const { memory, fields, maxItems } = input;

    const url = new URL(`https://api.apify.com/v2/actor-tasks/${taskId}/run-sync-get-dataset-items?`);

    const queryParams = {
        memory,
        format: 'csv',
        limit: maxItems,
        fields: fields.join(',')
    };

    url.search = new URLSearchParams(queryParams);

    const requestBody = {
        headers: {
            "Content-Type": "application/json",
            "Authorization": `bearer ${process.env.APIFY_TOKEN}`,
        }
    };

    const response = await fetch(url.href, requestBody);

    return await response.text();
}

/**
 * @param {String} taskId Task id or unique name
 * @param {Object} input Input object for task run configuration
 * @returns {Buffer} Dataset items buffered in csv text format
 */
async function getTaskRunResultUsingClient(taskId, input) {
    const apifyClient = new ApifyClient({ 'token': process.env.APIFY_TOKEN });
    const taskClient = apifyClient.task(taskId);

    const { memory, fields, maxItems } = input;

    const run = await taskClient.call({ memory });
    const runClient = apifyClient.run(run.id);

    const datasetClient = runClient.dataset();

    const downloadOptions = {
        limit: maxItems,
        fields
    };
    
    return await datasetClient.downloadItems('csv', downloadOptions);  
}
