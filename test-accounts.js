import { ApifyClient } from 'apify-client';
import dotenv from 'dotenv';
dotenv.config();
const client = new ApifyClient({ token: process.env.APIFY_API_TOKEN });
async function run() {
    const usernames = ["popga_official", "popupstorego", "the_hyundai_seoul", "datepop.official", "seoul_hotple", "seoultravel"];
    const input = {
        directUrls: usernames.map(u => `https://www.instagram.com/${u}/`),
        resultsType: "details"
    };
    const run = await client.actor("apify/instagram-scraper").call(input);
    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    console.log(`Fetched ${items.length} accounts`);
    items.forEach(i => {
        if (i.latestPosts) {
            console.log(`${i.username}: ${i.latestPosts.length} posts`);
        } else {
            console.log(`${i.username}: NO POSTS`);
        }
    });
}
run();
