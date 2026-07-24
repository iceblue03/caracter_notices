import { ApifyClient } from 'apify-client';
import dotenv from 'dotenv';
dotenv.config();
const client = new ApifyClient({ token: process.env.APIFY_API_TOKEN });
async function run() {
    const input = {
        directUrls: ["https://www.instagram.com/nintendo_korea/"],
        resultsType: "details"
    };
    const run = await client.actor("apify/instagram-scraper").call(input);
    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    if (items.length > 0 && items[0].latestPosts && items[0].latestPosts.length > 0) {
        console.log("Post keys:", Object.keys(items[0].latestPosts[0]));
        console.log("Post sample:", JSON.stringify(items[0].latestPosts[0], null, 2));
    }
}
run();
