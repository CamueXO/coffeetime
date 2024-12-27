const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const Tesseract = require('tesseract.js');
const sharp = require('sharp');
const app = express();

app.use(cors());
app.use('/static', express.static(path.join(__dirname, 'testimages')));

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

const cropImage = async (imagePath, outputPath) => {
    try {
        const image = sharp(imagePath);
        const { width, height } = await image.metadata();

        // 크롭할 영역의 좌표와 크기 설정 (예: 숫자 부분)
        const left = width * 0.2; // 이미지의 20% 지점에서 시작
        const top = height * 0.1; // 이미지의 30% 지점에서 시작
        const cropWidth = width * 0.6; // 이미지의 60% 너비
        const cropHeight = height * 0.4; // 이미지의 40% 높이

        await image
            .extract({ left: Math.floor(left), top: Math.floor(top), width: Math.floor(cropWidth), height: Math.floor(cropHeight) })
            .toFile(outputPath);
    } catch (error) {
        console.error('Failed to crop image:', error.message);
        throw error;
    }
};

app.get('/images', async (req, res) => {
    const imagePath = path.join(__dirname, 'testimages', '494.jpg');
    const croppedImagePath = path.join(__dirname, 'testimages', '494_cropped.jpg');
    console.log('Image path:', imagePath);

    try {
        if (!fs.existsSync(imagePath)) {
            throw new Error('Image file does not exist');
        }

        await cropImage(imagePath, croppedImagePath);

        const croppedImageBuffer = await fs.promises.readFile(croppedImagePath);

        const ocrResultText = await performOCR(croppedImageBuffer);
        const timestamp = new Date().toLocaleString();
        const base64Image = croppedImageBuffer.toString('base64');

        if (ocrResultText) {
            res.json({
                message: 'OCR performed successfully',
                timestamp,
                ocrResult: ocrResultText,
                imageUrl: '/static/494_cropped.jpg',
                base64Image: base64Image
            });
        } else {
            res.json({
                message: 'Failed to perform OCR, but image is sent successfully',
                timestamp,
                ocrResult: 'OCR 실패',
                imageUrl: '/static/494_cropped.jpg',
                base64Image: base64Image
            });
        }
    } catch (error) {
        console.error('Failed to process image:', error.message);
        res.status(500).json({ error: `Failed to process image: ${error.message}` });
    }
});

app.listen(3001, () => {
    console.log('Server is running on http://localhost:3001');
});
