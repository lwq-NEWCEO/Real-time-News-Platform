// frontend/src/pages/NewsDetail.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';

const NewsDetail = () => {
  const { id } = useParams();
  const [news, setNews] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`/api/news/${id}`);
        setNews(response.data);
        setError(null); // 清除历史错误
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, [id]);

  // 情感分析结果样式
  const sentimentClass = {
    positive: 'bg-green-100 border-l-4 border-green-500 text-green-700',
    negative: 'bg-red-100 border-l-4 border-red-500 text-red-700',
    neutral: 'bg-gray-100 border-l-4 border-gray-500 text-gray-700',
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {loading && (
        <div className="p-6 text-center">加载中...</div>
      )}
      {error && (
        <div className="p-6 text-center text-red-500">{error}</div>
      )}
      {!loading && !error && news ? (
        <div>
          <div className="mb-4 flex items-center">
            <Link to="/" className="text-blue-600 hover:text-blue-900 flex items-center gap-2">
              <FaArrowLeft />
              <span>返回新闻列表</span>
            </Link>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{news.title}</h1>
              
              <div className="flex items-center text-sm text-gray-500 mb-4">
                <span className="mr-4">{news.source}</span>
                <span className="mr-4">{new Date(news.published_at).toLocaleString()}</span>
                {news.sentiment && (
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${sentimentClass[news.sentiment.sentiment]}`}>
                    {news.sentiment.sentiment} ({news.sentiment.score.toFixed(2)})
                  </span>
                )}
              </div>
              
              {news.keywords && news.keywords.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">关键词:</h3>
                  <div className="flex flex-wrap gap-2">
                    {news.keywords.map((keyword, index) => (
                      <span key={index} className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="prose max-w-none">
                <p>{news.content}</p>
              </div>
              
              <div className="mt-6 pt-4 border-t">
                <a href={news.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                  阅读原文
                </a>
              </div>
            </div>
          </div>
        </div>
      ) : null}
      {!loading && !error && !news && (
        <div className="p-6 text-center">新闻不存在</div>
      )}
    </div>
  );
};

export default NewsDetail;