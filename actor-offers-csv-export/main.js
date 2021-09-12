import Apify, { main, getInput, setValue } from 'apify';
import fetch from 'node-fetch';
import { URLSearchParams } from 'url';

const { utils: { log } } = Apify;

main(async () => {
    const input = await getInput();
    const { useClient } = input;

    const taskName = 'lhotanok~laptop-search-task';

    const items = useClient ? await getTaskRunResultUsingClient(taskName, input)
        : await getTaskRunResultUsingApi(taskName, input);

    if (items.error) {
        log.info(`Task run error: ${items.error.message}`);
    } else {
        log.info(`Output items: ${items}`);
        await setValue('OUTPUT', items, { contentType: 'text/csv' }); // Save output
    }

    log.info('Export finished.')
});

/**
 * @param {String} taskId Task id or unique name
 * @param {Object} input Input object for task run configuration
 * @returns {Array} Dataset items
 */
async function getTaskRunResultUsingApi(taskId, input) {
    const { memory, fields, maxItems } = input;

    const url = new URL(`https://api.apify.com/v2/actor-tasks/${taskId}/run-sync-get-dataset-items?`);

    const params = new URLSearchParams(url.search);
    params.set('format', 'csv');
    params.set('memory', memory);
    params.set('limit', maxItems);
    params.set('fields', fields.join(','));

    const requestBody = {
        headers: {
            "Content-Type": "application/json",
            "Authorization": `bearer ${process.env.APIFY_TOKEN}`,
        }
    };

    const response = await fetch(url.toString() + params.toString(), requestBody);

    return await response.text();
}

/**
 * @param {String} taskId Task id or unique name
 * @param {Object} input Input object for task run configuration
 * @returns {Object} Result data
 */
async function getTaskRunResultUsingClient(taskId, input) {

}
