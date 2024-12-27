import express from 'express';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio'; // 최신 cheerio 버전 사용

const app = express();
const port = 3001;

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

app.get('/extract-images', async (req, res) => {
    const targetUrl = 'https://www.hanwha701.com';
    try {
        const response = await fetch(targetUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
        }
        const html = await response.text();
        
        const $ = cheerio.load(html);
        const imageUrls = [];

        $('img').each((index, element) => {
            const src = $(element).attr('src');
            console.log('찾은 이미지 경로:', src);
            if (src) {
                const url = src.startsWith('http') ? src : `${targetUrl}${src}`;
                imageUrls.push(url);
            }
        });

        console.log('추출된 이미지 URL:', imageUrls);

        if (imageUrls.length === 0) throw new Error('이미지를 찾을 수 없습니다.');

        res.json({ images: imageUrls, message: '데이터를 성공적으로 가져왔습니다.' });
    } catch (error) {
        console.error('서버 측 오류:', error);
        res.status(500).json({ error: '이미지 추출 실패' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
