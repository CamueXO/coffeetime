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

app.get('/images', async (req, res) => {
    const targetUrl = 'https://www.hanwha701.com';
    try {
        const browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });
        const page = await browser.newPage();
        await page.goto(targetUrl, { waitUntil: 'networkidle2' });

        // 첫 번째 이미지를 다운로드
        const imgSrc = await page.evaluate(() => {
            const img = document.querySelector('img');
            return img ? img.src : null;
        });

        if (imgSrc) {
            const viewSource = await page.goto(imgSrc);
            const buffer = await viewSource.buffer();

            fs.writeFile(path.join(__dirname, 'downloaded_image.jpg'), buffer, (err) => {
                if (err) {
                    console.error('Failed to save image:', err);
                    res.status(500).send('Failed to save image');
                } else {
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
        res.status(500).send('Failed to fetch image URLs');
    }
});

app.listen(3001, () => {
    console.log('Server is running on http://localhost:3001');
});