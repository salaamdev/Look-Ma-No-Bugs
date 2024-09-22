const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path');

puppeteer.use(StealthPlugin());  // Use stealth plugin to prevent detection

// Function to introduce a delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Function to save data to a JSON file
const saveData = (data) => {
    const filePath = path.join(__dirname, 'p2p_data.json');
    const timestamp = new Date().toISOString();
    const dataToSave = {
        timestamp,
        data
    };
    fs.appendFile(filePath, JSON.stringify(dataToSave, null, 2) + '\n', (err) => {
        if (err) {
            console.error('Error saving data:', err);
        } else {
            console.log('Data saved successfully.');
        }
    });
};

// Function to log errors to a file
const logError = (error) => {
    const filePath = path.join(__dirname, 'error_log.txt');
    const timestamp = new Date().toISOString();
    fs.appendFile(filePath, `${ timestamp } - Error: ${ error.message }\n`, (err) => {
        if (err) {
            console.error('Error logging error:', err);
        } else {
            console.log('Error logged successfully.');
        }
    });
};

// Function to scrape P2P data with retries
const scrapeP2P = async (page, retries = 10) => {
    console.log('Starting scraper...');

    try {
        // Navigate to the HTX P2P USDT-KES page
        await page.goto('https://www.htx.com/en-us/fiat-crypto/trade/buy-usdt-kes/', {
            waitUntil: 'domcontentloaded',
            timeout: 600000  // Set timeout to 10 minutes (600,000 ms)
        });

        // Wait for the necessary elements to load, with a longer timeout
        await page.waitForSelector('.trade-content', {timeout: 600000});  // 10 minutes

        // Add a 10-second delay before scraping the data
        console.log('Waiting for 10 seconds...');
        await delay(10000);  // 10 seconds delay

        // Scrape the user names, prices, stock, limits, payment methods, and trade count
        const p2pData = await page.evaluate(() => {
            const data = [];
            document.querySelectorAll(".otc-trade-list").forEach(tradeContent => {
                const nameElement = tradeContent.querySelector(".info-wrapper .name h3");
                const priceElement = tradeContent.querySelector(".price div");
                const stockElement = tradeContent.querySelector(".limit-box .stock");
                const limitElement = tradeContent.querySelector(".limit-box .limit");
                const paymentMethods = Array.from(tradeContent.querySelectorAll(".way .payment-icon .new-block")).map(el => el.textContent.trim());
                const tradeCountElement = tradeContent.querySelector(".grey-label-half span");

                if (nameElement && priceElement && stockElement && limitElement && tradeCountElement) {
                    data.push({
                        name: nameElement.textContent.trim(),
                        price: priceElement.textContent.trim(),
                        stock: stockElement.textContent.trim(),
                        limit: limitElement.textContent.trim(),
                        paymentMethods,
                        tradeCount: tradeCountElement.textContent.trim()
                    });
                }
            });
            return data;
        });

        // Log and save the scraped data
        console.log('P2P Trader Data:', p2pData);
        saveData(p2pData);
        console.log("Waiting 10 minutes before next scrape...");

    } catch (error) {
        console.error('Error during scraping:', error);
        logError(error);

        // Retry if there are retries left
        if (retries > 0) {
            console.log(`Retrying... Attempts left: ${ retries }`);
            await delay(60000);  // Wait before retrying
            await scrapeP2P(page, retries - 1);
        } else {
            console.log('No more retries left.');
        }
    }
};

// Function to run scraper every 10 minutes infinitely
const startScraper = async () => {
    // Launch Puppeteer browser once
    const browser = await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
        ]
    });

    const page = await browser.newPage();

    // Set user-agent to mimic a real browser
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

    // Initial run
    await scrapeP2P(page);

    // Schedule the scraper to run every 10 minutes (600,000 milliseconds)
    setInterval(async () => {
        await scrapeP2P(page);
    }, 600000);  // 600,000 ms = 10 minutes
};

// Start the infinite scraping process
startScraper();
