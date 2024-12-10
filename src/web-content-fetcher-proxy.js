import { useState } from 'react';

const useWebContentFetcher = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchContent = async (url) => {
    if (!url) {
      setError('URL이 필요합니다');
      return null;
    }

    setLoading(true);
    setError('');
    
    try {
      // 프록시 서버 URL로 변경
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
      const response = await fetch(proxyUrl);
      
      if (!response.ok) {
        throw new Error('페이지를 가져오는데 실패했습니다');
      }
      
      const data = await response.text();
      return data;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    fetchContent
  };
};

export default useWebContentFetcher;
