// frontend/src/components/WordCloud.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import WordCloud from 'react-d3-cloud'; // 确保您已安装：npm install react-d3-cloud
import '../styles/WordCloud.css'; 

const WordCloudComponent = () => {
  const [keywords, setKeywords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchKeywords = async () => {
      setLoading(true);
      setError(null);
      try {
        // 【修复 1】使用正确的后端 API 地址
        const res = await axios.get('/api/trends/keywords', {
          params: { 
            limit: 50,  // 获取前50个热门词
            timeRange: '7d' // 获取最近7天的数据
          }
        });

        // 【修复 2】处理后端返回的数据，字段为 { keyword, total_frequency }
        const formattedData = res.data
          .filter(item => item.keyword && typeof item.total_frequency === 'number')
          .map(item => ({ 
            text: item.keyword, 
            // `value` 决定词的大小，可以直接使用频率，或乘以系数放大效果
            value: item.total_frequency * 10 
          }));
        
        if (formattedData.length === 0) {
          setError('暂无热门关键词数据');
        } else {
          setKeywords(formattedData);
        }

      } catch (err) {
        console.error('词云数据获取失败:', err);
        setError(`词云数据加载失败: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchKeywords();
  }, []); // 空依赖数组，确保只在组件挂载时运行一次

  // D3-cloud 字体大小计算函数（可选，用于更好的视觉效果）
  const fontSizeMapper = word => Math.log2(word.value) * 5 + 16;
  
  // 渲染逻辑
  if (loading) {
    return (
      <div className="wordcloud-container text-center text-gray-500">
        <div className="animate-pulse">词云加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="wordcloud-container text-center text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        热门关键词词云
      </h2>
      <div className="wordcloud-container">
        <WordCloud
          data={keywords}
          fontSize={fontSizeMapper}
          rotate={0} // 可以设置为 () => (Math.random() - 0.5) * 60 来增加旋转效果
          padding={5}
          width={500} // 根据您的布局调整
          height={300} // 根据您的布局调整
          font="sans-serif"
        />
      </div>
    </div>
  );
};

export default WordCloudComponent;

