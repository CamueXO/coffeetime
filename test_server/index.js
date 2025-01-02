const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');
const https = require('https');
const fs = require('fs');
const path = require('path');
const Tesseract = require('tesseract.js');
const sharp = require('sharp');
const app = express();

app.use(cors());

const httpsAgent = new https.Agent({
    rejectUnauthorized: false,
});

app.use('/static', express.static(path.join(__dirname)));

let browser;

(async () => {
    try {
        browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu',
                '--single-process',
                '--disable-extensions',
            ],
        });
        console.log('Browser launched successfully');
    } catch (error) {
        console.error('Failed to launch browser:', error.message);
    }
})();

const performOCR = async (imageBuffer) => {
    try {
        const { data: { text } } = await Tesseract.recognize(imageBuffer, 'kor', {
            logger: m => console.log(m),
        });
        return text;
    } catch (error) {
        console.error('Failed to perform OCR:', error.message);
        return null;
    }
};

const cropImage = async (imageBuffer, outputPath) => {
    try {
        const image = sharp(imageBuffer);
        const { width, height } = await image.metadata();

        // 크롭할 영역의 좌표와 크기 설정 (예: 숫자 부분)
        const left = width * 0.3; // 이미지의 20% 지점에서 시작
        const top = height * 0.2; // 이미지의 30% 지점에서 시작
        const cropWidth = width * 0.2; // 이미지의 60% 너비
        const cropHeight = height * 0.1; // 이미지의 40% 높이

        await image
            .extract({ left: Math.floor(left), top: Math.floor(top), width: Math.floor(cropWidth), height: Math.floor(cropHeight) })
            .toFile(outputPath);
    } catch (error) {
        console.error('Failed to crop image:', error.message);
        throw error;
    }
};

const transformOCRText = (text) => {
    return text.replace(/ /g, '').replace(/\//g, '7').replace(/!/g, '1').replace(/\|/g, '1');
};

app.get('/images', async (req, res) => {
    const targetUrl = 'https://www.hanwha701.com';
    let page;

    try {
        if (!browser) {
            throw new Error('Browser instance is not initialized');
        }

        page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

        page.on('console', msg => {
            if (!msg.text().includes('Service Worker registration successful')) {
                console.log('PAGE LOG:', msg.text());
            }
        });
        page.on('requestfailed', request => {
            console.log(`Request failed: ${request.url()} - ${request.failure().errorText}`);
        });

        await page.goto(targetUrl, { waitUntil: 'load', timeout: 90000 });

        // 5초 대기
        await new Promise(resolve => setTimeout(resolve, 5000));

        // 이미지 소스를 base64 데이터로 변환
        const imgBase64 = await page.evaluate(async () => {
            const img = document.querySelector('img');
            if (img) {
                console.log('Image found:', img.src);

                // blob URL을 base64 데이터로 변환
                const response = await fetch(img.src);
                const blob = await response.blob();

                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                });
            } else {
                console.log('No image found');
                return null;
            }
        });

        if (imgBase64) {
            const base64Data = imgBase64.split(',')[1]; // base64 헤더를 제거
            const imageBuffer = Buffer.from(base64Data, 'base64');
            const croppedImagePath = path.join(__dirname, 'downloaded_image_cropped.jpg');

            await cropImage(imageBuffer, croppedImagePath);

            const croppedImageBuffer = await fs.promises.readFile(croppedImagePath);

            let ocrResultText = await performOCR(croppedImageBuffer);
            if (ocrResultText) {
                ocrResultText = transformOCRText(ocrResultText);
            }

            const timestamp = new Date().toLocaleString();
            const base64CroppedImage = croppedImageBuffer.toString('base64');

            res.json({
                message: ocrResultText ? 'OCR performed successfully' : 'Failed to perform OCR, but image is sent successfully',
                timestamp,
                ocrResult: ocrResultText || 'OCR 실패',
                imageUrl: '/static/downloaded_image_cropped.jpg',
                base64Image: base64CroppedImage
            });
        } else {
            console.error('No images found on the page');
            res.status(404).send('No images found on the page');
        }
    } catch (error) {
        console.error('Failed to fetch image:', error.message);
        res.status(500).send(`Failed to fetch image: ${error.message}`);
    } finally {
        if (page) {
            await page.close();
        }
    }
});

app.listen(3001, () => {
    console.log('Server is running on http://localhost:3001');
});
