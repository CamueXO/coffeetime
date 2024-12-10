import React, { useState, useEffect, useRef } from 'react';
import useWebContentFetcher from './web-content-fetcher-proxy';

function App() {
    const [ticketNumber, setTicketNumber] = useState('');
    const [currentNumber, setCurrentNumber] = useState(0);
    const [alertVisible, setAlertVisible] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const inputRef = useRef(null);
    const { fetchAndSave, loading, error } = useWebContentFetcher();

    // isNumber 함수 정의
    const isNumber = (value) => {
        return !isNaN(value) && value.trim() !== '';
    };

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
        if (!isNumber(inputValue) || inputValue.length < 2) {
            alert("유효한 대기표 번호를 입력하세요.");
            return;
        }
        setTicketNumber(inputValue);
        setInputValue('');
        inputRef.current.focus();

        // 웹 페이지 가져오기 및 저장
        try {
            await fetchAndSave('https://www.testurl.com');
        } catch (err) {
            console.error('웹 페이지 저장 실패:', err);
        }
    };

    const handleCloseAlert = () => {
        setAlertVisible(false);
    };

    return (
        <form onSubmit={handleSubmit}>
            <h1>커피 대기 알림</h1>
            <p>현재 번호: {currentNumber}</p>
            <input
                type="number"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                ref={inputRef}
                placeholder="대기표 번호 입력"
            />
            <button type="submit" disabled={loading}>
                {loading ? '가져오는 중...' : '제출'}
            </button>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {alertVisible && (
                <div>
                    <p>알림: 당신의 커피가 준비되었습니다!</p>
                    <button onClick={handleCloseAlert}>닫기</button>
                </div>
            )}
        </form>
    );
}

export default App;