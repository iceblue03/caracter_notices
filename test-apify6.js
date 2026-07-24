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
    console.log(`Fetched ${items.length} items`);
    if (items.length > 0) {
        const item = items[0];
        console.log("Keys:", Object.keys(item));
        if (item.latestPosts) {
            console.log("Latest posts count:", item.latestPosts.length);
        }
    }
}
run();
