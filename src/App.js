import React, { useState, useEffect, useRef } from 'react';
// import useWebContentFetcher from './web-content-fetcher.tsx';
import useWebContentFetcher from './web-content-fetcher-proxy';

function App() {
    const [ticketNumber, setTicketNumber] = useState('');
    const [currentNumber, setCurrentNumber] = useState(0);
    const [alertVisible, setAlertVisible] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [url, setUrl] = useState('https://example.com'); // 가져올 웹페이지 URL
    const inputRef = useRef(null);
    const { fetchContent, loading, error } = useWebContentFetcher();

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

    const handleInputChange = (e) => {
        setInputValue(e.target.value);
    };

    // 웹 페이지 내용을 파일로 저장하는 함수
    const saveToFile = (content) => {
        const blob = new Blob([content], { type: 'text/html' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `webpage-${new Date().getTime()}.html`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isNumber(inputValue) || inputValue.length < 2) {
            alert("유효한 대기표 번호를 입력하세요.");
            return;
        }
        setTicketNumber(inputValue);
        setInputValue('');
        inputRef.current.focus();

        // 웹 페이지 내용 가져오기 및 저장
        try {
            const content = await fetchContent(url);
            if (content) {
                saveToFile(content);
            }
        } catch (err) {
            console.error('웹 페이지 가져오기 실패:', err);
        }
    };

    const handleCloseAlert = () => {
        setAlertVisible(false);
    };

    return (
        <div className="p-4">
            <form onSubmit={handleSubmit}>
                <h1>커피 대기 알림</h1>
                <p>현재 번호: {currentNumber}</p>
                <div className="mb-4">
                    <label className="block mb-2">웹페이지 URL:</label>
                    <input
                        type="text"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        className="w-full p-2 border rounded mb-2"
                        placeholder="https://example.com"
                    />
                </div>
                <input
                    type="number"
                    value={inputValue}
                    onChange={handleInputChange}
                    ref={inputRef}
                    placeholder="대기표 번호 입력"
                    className="p-2 border rounded mr-2"
                />
                <button 
                    type="submit" 
                    className="px-4 py-2 bg-blue-500 text-white rounded"
                    disabled={loading}
                >
                    {loading ? '가져오는 중...' : '제출'}
                </button>
                {error && (
                    <p className="text-red-500 mt-2">{error}</p>
                )}
                {alertVisible && (
                    <div className="mt-4 p-4 bg-green-100 rounded">
                        <p>알림: 당신의 커피가 준비되었습니다!</p>
                        <button 
                            onClick={handleCloseAlert}
                            className="mt-2 px-4 py-2 bg-green-500 text-white rounded"
                        >
                            닫기
                        </button>
                    </div>
                )}
            </form>
        </div>
    );
}

export default App;