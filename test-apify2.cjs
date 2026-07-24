const { ApifyClient } = require('apify-client');
const client = new ApifyClient({ token: process.env.APIFY_API_TOKEN });

async function run() {
    const input = {
        search: "nintendo_korea",
        searchType: "user",
        resultsType: "posts",
        resultsLimit: 2
    };
    console.log("starting");
    const run = await client.actor("apify/instagram-scraper").call(input);
    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    console.log(JSON.stringify(items, null, 2));
}
run();
