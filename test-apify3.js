import { ApifyClient } from 'apify-client';
import dotenv from 'dotenv';
dotenv.config();

const client = new ApifyClient({ token: process.env.APIFY_API_TOKEN });

async function run() {
    const input = {
        directUrls: [
            "https://www.instagram.com/nintendo_korea/",
            "https://www.instagram.com/animate_hongdae/"
        ],
        resultsType: "posts",
        resultsLimit: 4
    };
    console.log("starting");
    const run = await client.actor("apify/instagram-scraper").call(input);
    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    console.log(`Fetched ${items.length} items`);
    items.forEach(i => console.log(i.ownerUsername || i.username, i.url));
}
run();
