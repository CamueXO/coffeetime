const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');
const https = require('https');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(cors());

const httpsAgent = new https.Agent({
    rejectUnauthorized: false,
});

app.use('/static', express.static(path.join(__dirname)));

app.get('/images', async (req, res) => {
    const targetUrl = 'https://www.hanwha701.com';
    try {
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-accelerated-2d-canvas', '--disable-gpu'],
        });
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

        page.on('console', msg => console.log('PAGE LOG:', msg.text()));
        page.on('requestfailed', request => {
            console.log(`Request failed: ${request.url()} - ${request.failure().errorText}`);
        });

        await page.goto(targetUrl, { waitUntil: 'load', timeout: 90000 });

        const imgSrc = await page.evaluate(() => {
            const img = document.querySelector('img');
            return img ? img.src : null;
        });

        if (imgSrc) {
            const viewSource = await page.goto(imgSrc);
            const buffer = await viewSource.buffer();
            const imagePath = path.join(__dirname, 'downloaded_image.jpg');

            fs.writeFile(imagePath, buffer, (err) => {
                if (err) {
                    console.error('Failed to save image:', err);
                    res.status(500).send('Failed to save image');
                } else {
                    console.log('Image saved at:', imagePath);
                    res.json({ message: 'Image saved successfully' });
                }
            });
        } else {
            console.error('No images found on the page');
            res.status(404).send('No images found on the page');
        }
        await browser.close();
    } catch (error) {
        console.error('Failed to fetch image URLs:', error.message);
        await fs.writeFile('error_html.html', await page.content());
        await page.screenshot({ path: 'error_screenshot.png' });
        res.status(500).send('Failed to fetch image URLs');
    }
});

app.listen(3001, () => {
    console.log('Server is running on http://localhost:3001');
});
