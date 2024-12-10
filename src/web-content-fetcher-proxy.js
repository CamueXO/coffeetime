import { useState } from 'react';

const useWebContentFetcher = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchAndSave = async (url) => {
    if (!url) {
      setError('URL이 필요합니다');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      // CORS 우회를 위한 프록시 서버 사용
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
      const response = await fetch(proxyUrl);
      
      if (!response.ok) {
        throw new Error('페이지를 가져오는데 실패했습니다');
      }
      
      const content = await response.text();
      
      // 파일로 저장
      const timestamp = new Date().getTime();
      const blob = new Blob([content], { type: 'text/html;charset=utf-8' });
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `webpage-${timestamp}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);

      return content;
    } catch (err) {
      console.error('오류 발생:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    fetchAndSave
  };
};

export default useWebContentFetcher;