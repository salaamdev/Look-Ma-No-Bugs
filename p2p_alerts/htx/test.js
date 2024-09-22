const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
    try {
        const browser = await puppeteer.launch({headless: false});
        const page = await browser.newPage();
        await page.goto('https://www.google.com');

        console.log('Taking screenshot...');
        await page.screenshot({path: 'screenshot.png'});
        console.log('Screenshot saved.');

        // Extract data from the page
        const data = await page.evaluate(() => {
            const rows = document.querySelectorAll('.trade-content .trade-row');
            const data = [];
            rows.forEach(row => {
                const userName = row.querySelector('.user-name').textContent;
                const price = row.querySelector('.price').textContent;
                const stock = row.querySelector('.stock').textContent;
                const limits = row.querySelector('.limits').textContent;
                const paymentMethods = row.querySelector('.payment-methods').textContent;
                const tradeCount = row.querySelector('.trade-count').textContent;
                data.push({
                    userName,
                    price,
                    stock,
                    limits,
                    paymentMethods,
                    tradeCount
                });
            });
            return data;
        });

        console.log('Data extracted:', data);

        // Save the data to a file
        saveData(data);

        console.log('Data saved successfully.');
    } catch (error) {
        console.error('Error scraping data:', error);
        logError(error);

        if (retries > 0) {
            console.log(`Retrying in ${ delay / 1000 } seconds...`);
            await delay(delay);
            await scrapeP2P(page, retries - 1, delay * 2);
        }
    } finally {
        console.log('finalll');
        // if (browser) {
        // await browser.close();
        // }
    }

    console.log('Scraping complete.');
})();

// Function to save the data to a file
const saveData = (data) => {
    const filePath = path.join(__dirname, 'data.json');
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log('Data saved successfully.');
}

// Function to log errors to a file
const logError = (error) => {
    const filePath = path.join(__dirname, 'error.log');
    fs.appendFileSync(filePath, `${ new Date().toISOString() } - Error: ${ error.message }\n`);
    console.log('Error logged successfully.');
}
