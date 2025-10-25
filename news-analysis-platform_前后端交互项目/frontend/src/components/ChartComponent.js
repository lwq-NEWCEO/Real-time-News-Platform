// src/components/ChartComponent.js
import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import 'echarts/theme/dark'; // 引入暗色主题

const ChartComponent = ({ 
  data, 
  chartType = 'line', 
  title = '数据分析', 
  darkMode = false,
  height = 400
}) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  // 初始化图表
  useEffect(() => {
    if (chartRef.current) {
      // 销毁旧实例
      if (chartInstance.current) {
        chartInstance.current.dispose();
      }
      
      // 初始化新实例
      chartInstance.current = echarts.init(
        chartRef.current, 
        darkMode ? 'dark' : null
      );
      
      // 设置响应式
      const resizeHandler = () => {
        chartInstance.current.resize();
      };
      window.addEventListener('resize', resizeHandler);
      
      return () => {
        window.removeEventListener('resize', resizeHandler);
        if (chartInstance.current) {
          chartInstance.current.dispose();
        }
      };
    }
  }, [darkMode]);

  // 更新图表数据和配置
  useEffect(() => {
    if (chartInstance.current && data) {
      const option = {
        title: {
          text: title,
          textStyle: {
            color: darkMode ? '#fff' : '#090040'
          }
        },
        tooltip: {
          trigger: 'axis',
          backgroundColor: darkMode ? 'rgba(40, 40, 40, 0.9)' : 'rgba(255, 255, 255, 0.9)',
          borderColor: darkMode ? '#555' : '#ddd',
          textStyle: {
            color: darkMode ? '#fff' : '#333'
          },
          axisPointer: {
            type: 'shadow',
            label: {
              backgroundColor: '#6a7985'
            }
          }
        },
        legend: {
          data: data.legend || [],
          textStyle: {
            color: darkMode ? '#fff' : '#666'
          }
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: data.xAxis || [],
          axisLine: {
            lineStyle: {
              color: darkMode ? '#666' : '#ccc'
            }
          },
          axisLabel: {
            color: darkMode ? '#999' : '#666'
          }
        },
        yAxis: {
          type: 'value',
          axisLine: {
            lineStyle: {
              color: darkMode ? '#666' : '#ccc'
            }
          },
          axisLabel: {
            color: darkMode ? '#999' : '#666'
          },
          splitLine: {
            lineStyle: {
              color: darkMode ? '#444' : '#eee'
            }
          }
        },
        series: data.series.map((s, i) => ({
          ...s,
          type: chartType,
          smooth: true,
          lineStyle: {
            width: 3,
            shadowColor: 'rgba(0,0,0,0.3)',
            shadowBlur: 10,
            shadowOffsetY: 8
          },
          itemStyle: {
            color: [
              '#090040', 
              '#471396', 
              '#B13BFF', 
              '#FFCC00'
            ][i % 4]
          },
          areaStyle: chartType === 'line' ? {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(179, 59, 255, 0.5)' },
              { offset: 1, color: 'rgba(179, 59, 255, 0.1)' }
            ])
          } : null
        })),
        animation: true,
        animationDuration: 1000,
        animationEasing: 'cubicOut'
      };

      chartInstance.current.setOption(option);
    }
  }, [data, chartType, title, darkMode]);

  return (
    <div 
      ref={chartRef} 
      className="w-full rounded-xl shadow-lg overflow-hidden"
      style={{
        height: `${height}px`,
        backgroundColor: darkMode ? '#1e1e1e' : '#fff',
        border: `1px solid ${darkMode ? '#333' : '#eee'}`
      }}
    />
  );
};

export default ChartComponent;