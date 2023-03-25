import puppeteer from "puppeteer";
import path from "node:path";
import fs from "node:fs";

const MANGAS_PATH = path.resolve(__dirname, "..", "mangas");
if (!fs.existsSync(MANGAS_PATH)) {
    console.info("Creating paste for download mangás");
    fs.mkdirSync(MANGAS_PATH);
};

async function main() {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    const MANGA_LINK = process.argv[2];
    const MANGA_NAME = process.argv[3];
    const MANGA_PATH = path.join(MANGAS_PATH, MANGA_NAME);
    if (!fs.existsSync(MANGA_PATH)) {
        console.info("Create paste for download mangá");
        fs.mkdirSync(MANGA_PATH);
    }

    let MANGA_EPISODE = 1;

    await page.goto(MANGA_LINK, {
        waitUntil: "networkidle2"
    });

    const episodesLinks = await page.$eval("ul.full-chapters-list", el => {
        const _links: string[] = [];

        for (const child of el.children) {
            const link = child.querySelector('a')?.href;
            if (link) _links.push(link);

        };

        return _links;
    });

    for (const episodeLink of episodesLinks.reverse()) {
        const MANGA_EPISODE_PATH = path.join(MANGA_PATH, MANGA_EPISODE.toString());
        if (!fs.existsSync(MANGA_EPISODE_PATH)) {
            console.info("Creating paste for donwload mangá episode");
            fs.mkdirSync(MANGA_EPISODE_PATH);
        };

        await page.goto(episodeLink, {
            waitUntil: "networkidle2"
        });

        const totalOfPages = await page.$eval("div.page-navigation", el => {
            const pageNumbers = Number(el.querySelectorAll("span em")[1].textContent);
            return pageNumbers;
        });

        for (let pageNumber = 1; pageNumber !== totalOfPages; pageNumber++) {
            const MANGA_PAGE_PATH = path.join(MANGA_EPISODE_PATH, `page-${pageNumber}.png`);
            if (fs.existsSync(MANGA_PAGE_PATH)) {
                console.info(`Skip page ${pageNumber} of episode ${MANGA_EPISODE} because already exist`);
                
                await page.waitForSelector("div.page-next");
                await page.click("div.page-next");

                continue;
            };

            await page.waitForSelector("div.manga-image picture img");

            const image = await page.$("div.manga-image picture img");
            console.info(`Download page ${pageNumber} of episode ${MANGA_EPISODE}`);
            await image?.screenshot({
                path: path.join(MANGA_EPISODE_PATH, `page-${pageNumber}.png`),
                omitBackground: true
            });

            await page.waitForSelector("div.page-next");
            await page.click("div.page-next");
        }

        MANGA_EPISODE++;
    }

    await page.close();
    await browser.close();
}

main();
