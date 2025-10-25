import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import axios from 'axios';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

// 注册Chart.js组件
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const TrendChart = () => {
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTrends = async () => {
      setLoading(true);
      setError(null);
      try {
        // 与后端分页接口对齐，明确传参
        const response = await axios.get('/api/trends', {
          params: { 
            timeRange: '30d', 
            page: 1,    // 固定第一页（可根据需求调整）
            limit: 30   // 拉取30天数据
          }
        });

        // 适配后端分页结构 { data: [...], pagination: {} }
        if (!response.data || !Array.isArray(response.data.data)) {
          throw new Error('趋势数据格式错误，缺少 data 字段');
        }

        // 过滤无效数据（无日期/频率）
        const validTrends = response.data.data.filter(item => 
          item.date && item.frequency !== undefined
        );

        if (validTrends.length === 0) {
          setError('暂无趋势数据');
          return;
        }

        setTrends(validTrends);
      } catch (err) {
        console.error('趋势数据获取失败：', err);
        setError(`趋势数据获取失败：${err.message || '未知错误'}`);
        setTrends([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTrends();
  }, []);

  // 格式化图表数据（兼容后端日期格式）
  const formatChartData = () => {
    if (trends.length === 0) return { labels: [], datasets: [] };

    // 处理日期格式（兼容 'YYYY-MM-DD' 或 ISO 时间戳）
    const parseDate = (dateStr) => {
      const date = new Date(dateStr);
      // 修复无效日期导致的 NaN 问题
      return isNaN(date.getTime()) ? '无效日期' : date;
    };

    return {
      labels: trends.map(t => {
        const dateObj = parseDate(t.date);
        return dateObj instanceof Date 
          ? dateObj.toLocaleDateString() 
          : dateObj;
      }),
      datasets: [{
        label: '关键词出现频率',
        data: trends.map(t => t.frequency),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 2,
        borderRadius: 4,
        hoverBackgroundColor: 'rgba(75, 192, 192, 0.8)' // 交互反馈
      }]
    };
  };

  // 图表配置增强
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: '30天关键词趋势分析',
        font: { size: 16, weight: 'bold' }
      },
      legend: { position: 'bottom' },
      tooltip: {
        callbacks: {
          // 自定义 tooltip 显示内容
          label: (context) => `${context.raw} 次`,
          title: (context) => `日期：${context[0].label}`
        }
      }
    },
    scales: {
      x: {
        title: { display: true, text: '日期' },
        ticks: { 
          maxRotation: 45, 
          minRotation: 45,
          color: '#666' // 增强可读性
        },
        grid: { display: false } // 隐藏x轴网格线
      },
      y: {
        title: { display: true, text: '出现次数' },
        beginAtZero: true,
        ticks: { 
          precision: 0,
          color: '#666'
        },
        grid: { color: 'rgba(0,0,0,0.05)' } // 弱化y轴网格线
      }
    },
    // 动画优化（可选）
    animation: {
      duration: 800,
      easing: 'easeOutQuad'
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-pulse">趋势图表加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-500">
        {error}
      </div>
    );
  }

  if (trends.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        暂无趋势数据
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        关键词趋势分析（30天）
      </h2>
      <div className="h-80">
        <Bar 
          data={formatChartData()} 
          options={chartOptions} 
          // 可选：监听图表点击事件
          onClick={(event, elements) => {
            if (elements.length > 0) {
              const { index } = elements[0];
              console.log('点击了', trends[index].date, '的数据');
            }
          }}
        />
      </div>
    </div>
  );
};

export default TrendChart;