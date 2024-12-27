const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const Tesseract = require('tesseract.js');
const app = express();

app.use(cors());

app.use('/static', express.static(path.join(__dirname, 'testimages')));

const performOCR = async (imagePath) => {
    try {
        const { data: { text } } = await Tesseract.recognize(imagePath, 'eng', {
            logger: m => console.log(m),
        });
        return text;
    } catch (error) {
        console.error('Failed to perform OCR:', error.message);
        return null;
    }
};

app.get('/images', async (req, res) => {
    const imagePath = path.join(__dirname, 'testimages', '490.jpg');
    console.log('Image path:', imagePath);

    try {
        if (!fs.existsSync(imagePath)) {
            throw new Error('Image file does not exist');
        }

        const ocrResult = await performOCR(imagePath);
        if (ocrResult) {
            const timestamp = new Date().toLocaleString();
            res.json({ message: 'OCR performed successfully', timestamp, ocrResult, imageUrl: '/static/490.jpg' });
        } else {
            res.status(500).send('Failed to perform OCR');
        }
    } catch (error) {
        console.error('Failed to read image file:', error.message);
        res.status(500).send(`Failed to read image file: ${error.message}`);
    }
});

app.listen(3001, () => {
    console.log('Server is running on http://localhost:3001');
});
