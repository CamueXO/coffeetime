import React, { useState, useEffect, useRef } from 'react';

function App() {
    const [ticketNumber, setTicketNumber] = useState('');
    const [currentNumber, setCurrentNumber] = useState(0);
    const [alertVisible, setAlertVisible] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [imageBase64, setImageBase64] = useState('');
    const [imageUpdatedTime, setImageUpdatedTime] = useState('');
    const [ocrResult, setOcrResult] = useState('');
    const [error, setError] = useState(null);
    const inputRef = useRef(null);

    const isNumber = (value) => {
        return !isNaN(value) && value.trim() !== '';
    };

    useEffect(() => {
        const fetchImage = async () => {
            try {
                const response = await fetch('http://localhost:3001/images');
                const data = await response.json();
                if (response.ok) {
                    setImageBase64(`data:image/jpeg;base64,${data.base64Image}`);
                    setImageUpdatedTime(data.timestamp);
                    setOcrResult(data.ocrResult);
                    setError(null);
                } else {
                    throw new Error(data.error);
                }
            } catch (error) {
                console.error('이미지를 가져오는 중 오류가 발생했습니다:', error);
                setError(error.message);
            }
        };

        fetchImage();

        const interval = setInterval(fetchImage, 5000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentNumber(prev => {
                const newNumber = prev + 1;
                if (isNumber(ticketNumber) && ticketNumber.length > 1 && newNumber === parseInt(ticketNumber)) {
                    setAlertVisible(true);
                }
                return newNumber;
            });
        }, 5000);

        return () => clearInterval(interval);
    }, [ticketNumber]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isNumber(inputValue)) {
            alert("유효한 대기표 번호를 입력하세요.");
            return;
        }
        setTicketNumber(inputValue);
        setInputValue('');
        inputRef.current.focus();
    };

    const handleCloseAlert = () => {
        setAlertVisible(false);
        setImageBase64('');
    };

    return (
        <form onSubmit={handleSubmit} style={{ textAlign: 'center' }}>
            <h1>커피 대기 알림</h1>
            <p>현재 번호: {currentNumber}</p>
            <input
                type="number"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                ref={inputRef}
                placeholder="대기표 번호 입력"
            />
            <button type="submit">
                제출
            </button>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {alertVisible && (
                <div>
                    <p>알림: 당신의 커피가 준비되었습니다!</p>
                    <button onClick={handleCloseAlert}>닫기</button>
                    {imageBase64 && (
                        <>
                            <p>이미지 업데이트 시간: {imageUpdatedTime}</p>
                            <img src={imageBase64} alt="Downloaded" style={{ maxWidth: '100%', height: 'auto' }} />
                            <p>추출된 숫자: {ocrResult}</p>
                        </>
                    )}
                </div>
            )}
            {imageBase64 && (
                <>
                    <p>이미지 업데이트 시간: {imageUpdatedTime}</p>
                    <img src={imageBase64} alt="Downloaded" style={{ maxWidth: '100%', height: 'auto' }} />
                    <p>추출된 숫자: {ocrResult}</p>
                </>
            )}
        </form>
    );
}

export default App;
