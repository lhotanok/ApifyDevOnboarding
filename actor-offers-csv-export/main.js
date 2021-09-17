import Apify, { getInput, setValue } from 'apify';
import fetch from 'node-fetch';
import { URLSearchParams } from 'url';

const { utils: { log } } = Apify;

Apify.main(async () => {
    const input = await getInput();
    const { useClient } = input;

    const TASK_NAME = 'lhotanok~laptop-search-task';

    const items = useClient 
        ? await getTaskRunResultUsingClient(TASK_NAME, input)
        : await getTaskRunResultUsingApi(TASK_NAME, input);

    log.info(`Output items: ${items}`);

    if (items.error) {
        throw new Error(items.error.message);
    } else {
        // sets .csv extension automatically (works locally but not on Apify platform)
        // if called with 'OUTPUT.csv' parameter locally, OUTPUT.csv.csv is created 👀
        // await setValue('OUTPUT', items, { contentType: 'text/csv' });
        
        await setValue('OUTPUT.csv', items, { contentType: 'text/csv' });
        log.info('Export finished.');
    }
});

/**
 * @param {String} taskId Task id or unique name
 * @param {Object} input Input object for task run configuration
 * @returns {Promise<String>} Dataset items in csv text format
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

    log.info(`Starting task run. Task id: ${taskId}`);
    const response = await fetch(url.href, requestBody);

    return response.text();
}

/**
 * @param {String} taskId Task id or unique name
 * @param {Object} input Input object for task run configuration
 * @param {Number} input.memory
 * @param {Array} input.fields
 * @param {Number} input.maxItems
 * @returns {Promise<Buffer>} Dataset items buffered in csv text format
 */
async function getTaskRunResultUsingClient(taskId, input) {
    const apifyClient = new Apify.newClient({ 'token': process.env.APIFY_TOKEN });
    const taskClient = apifyClient.task(taskId);

    const { memory, fields, maxItems } = input;

    log.info(`Starting task run. Task id: ${taskId}`);
    const run = await taskClient.call({ memory });

    const runClient = apifyClient.run(run.id);

    const datasetClient = runClient.dataset();

    const downloadOptions = {
        limit: maxItems,
        fields
    };
    
    return datasetClient.downloadItems('csv', downloadOptions);  
}
