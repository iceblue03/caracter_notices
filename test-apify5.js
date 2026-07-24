import { ApifyClient } from 'apify-client';
import dotenv from 'dotenv';
dotenv.config();
const client = new ApifyClient({ token: process.env.APIFY_API_TOKEN });
async function run() {
    const input = {
        usernames: ["nintendo_korea"],
        resultsLimit: 3
    };
    const run = await client.actor("apify/instagram-scraper").call(input);
    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    console.log(`Fetched ${items.length} items`);
    items.forEach(i => console.log(i.ownerUsername, i.url));
}
run();
