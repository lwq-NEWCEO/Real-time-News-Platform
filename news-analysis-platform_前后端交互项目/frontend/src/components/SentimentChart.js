// frontend/src/components/SentimentChart.js
import React, { useEffect, useState } from 'react';
import { Pie } from 'react-chartjs-2';
import axios from 'axios';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

// 注册Chart.js组件（必须步骤）
ChartJS.register(ArcElement, Tooltip, Legend);

const SentimentChart = () => {
  // 我们将直接从API获取数据，所以初始状态是空数组
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSentiments = async () => {
      try {
        setLoading(true);
        setError(null);

        // 【关键修复】请求我们新创建的、专门用于情感统计的API
        const response = await axios.get('/api/sentiments');

        // 后端返回的数据格式为: [{ sentiment: 'Positive', count: 40 }, ...]
        const apiData = response.data;

        // 如果没有数据，设置一个友好的提示
        if (!apiData || apiData.length === 0) {
          setError('暂无情感数据可供分析');
          setLoading(false);
          return;
        }

        // 将API数据转换为Chart.js需要的格式
        const labels = apiData.map(item => item.sentiment);
        const dataValues = apiData.map(item => item.count);

        const backgroundColorMap = {
          'Positive': 'rgba(34, 197, 94, 0.7)',  // 绿色
          'Negative': 'rgba(239, 68, 68, 0.7)',  // 红色
          'Neutral': 'rgba(59, 130, 246, 0.7)',   // 蓝色
        };
        const borderColorMap = {
          'Positive': 'rgba(34, 197, 94, 1)',
          'Negative': 'rgba(239, 68, 68, 1)',
          'Neutral': 'rgba(59, 130, 246, 1)',
        };

        // 更新图表数据状态
        setChartData({
          labels: labels,
          datasets: [{
            data: dataValues,
            backgroundColor: labels.map(label => backgroundColorMap[label] || 'rgba(156, 163, 175, 0.7)'), // 灰色作为备用
            borderColor: labels.map(label => borderColorMap[label] || 'rgba(156, 163, 175, 1)'),
            borderWidth: 1
          }]
        });

      } catch (err) {
        setError('情感数据加载失败：' + (err.response?.data?.error || err.message));
      } finally {
        setLoading(false);
      }
    };
    fetchSentiments();
  }, []); // 空依赖数组，确保只在组件挂载时运行一次

  // 图表配置 (沿用您原来的优秀配置)
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        position: 'bottom' 
      },
      // 移除旧的标题，因为我们在JSX中已经有了一个h2标题
      title: {
        display: false,
      }
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6 text-center">
        <div className="animate-pulse">情感分析图加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6 text-center text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">情感分布</h2>
      <div className="relative h-64 md:h-80">
        {/* 直接使用Pie组件渲染，数据来自我们新的state */}
        {chartData.datasets.length > 0 ? (
          <Pie data={chartData} options={chartOptions} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">数据为空</div>
        )}
      </div>
    </div>
  );
};

export default SentimentChart;

