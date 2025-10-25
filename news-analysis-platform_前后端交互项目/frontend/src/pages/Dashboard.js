import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Row, Col, Card, Spin, Empty, Table, Tag, Select } from 'antd';
import WordCloud from 'react-d3-cloud';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts/core';
import { TooltipComponent, GridComponent, LegendComponent } from 'echarts/components';
import { LineChart, PieChart } from 'echarts/charts';
import { UniversalTransition } from 'echarts/features';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([TooltipComponent, GridComponent, LegendComponent, LineChart, PieChart, CanvasRenderer, UniversalTransition]);

// 错误边界组件 (无改动)
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError(error) { return { hasError: true }; }
  componentDidCatch(error, errorInfo) { console.error("Dashboard Uncaught error:", error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return ( <Card> <Empty description="组件加载失败，请稍后重试或联系管理员。" /> </Card> );
    }
    return this.props.children;
  }
}

// 颜色方案 (无改动)
const colors = {
  primary: '#090040',
  secondary: '#471396',
  accent: '#B13BFF',
  highlight: '#FFCC00',
  lightBg: '#f9fafb',
  cardBg: '#ffffff',
};

// 表格列定义 (无改动)
const columns = [
  { title: '标题', dataIndex: 'title', key: 'title', render: (text, record) => ( <a href={record.url} target="_blank" rel="noopener noreferrer" style={{ color: colors.accent, fontWeight: 500 }} > {text} </a> ), },
  { title: '来源', dataIndex: 'source', key: 'source', render: (text) => <span style={{ color: colors.secondary }}>{text}</span>, },
  { title: '情感', dataIndex: 'sentiment', key: 'sentiment', render: (sentiment) => { let color = colors.primary; if (sentiment === 'Positive') color = colors.highlight; if (sentiment === 'Negative') color = colors.accent; return ( <Tag color={color} style={{ fontWeight: 600, borderRadius: '12px', padding: '0 12px', }} > {sentiment} </Tag> ); }, },
  { title: '发布时间', dataIndex: 'published_at', key: 'published_at', render: (date) => ( <span style={{ color: colors.secondary }}> {new Date(date).toLocaleString()} </span> ), },
];

const Dashboard = ({ darkMode, colorPrimary = colors.accent }) => {
  const [loading, setLoading] = useState(true);
  const [newsData, setNewsData] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [sentimentOptions, setSentimentOptions] = useState(null);
  const [selectedKeyword, setSelectedKeyword] = useState(null);
  const [timeRange, setTimeRange] = useState('7d');
  const [trendChartData, setTrendChartData] = useState(null);
  const [trendChartLoading, setTrendChartLoading] = useState(false);
  const wordCloudWrapperRef = useRef(null);
  const [wordCloudSize, setWordCloudSize] = useState({ width: 0, height: 0 });

  // 获取初始数据
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [newsRes, keywordsRes, sentimentsRes] = await Promise.all([
          axios.get('http://localhost:8000/api/news'),
          axios.get('http://localhost:8000/api/trends/keywords', { params: { timeRange, limit: 50 } }),
          axios.get('http://localhost:8000/api/sentiments'),
        ]);
        setNewsData(Array.isArray(newsRes.data.data) ? newsRes.data.data : []);
        const formattedKeywords = Array.isArray(keywordsRes.data) ? keywordsRes.data.map(item => ({ text: item.keyword, value: item.total_frequency })) : [];
        setTrendData(formattedKeywords);
        if (formattedKeywords.length > 0 && selectedKeyword === null) {
          setSelectedKeyword(formattedKeywords[0].text);
        }
        if (Array.isArray(sentimentsRes.data) && sentimentsRes.data.length > 0) {
          const pieData = sentimentsRes.data.map(item => ({ value: item.count, name: item.sentiment }));
          setSentimentOptions({
            tooltip: { trigger: 'item' },
            // 修正 1: 调整图例位置到右下角
            legend: {
              orient: 'vertical',    // 垂直排列
              right: '5%',           // 靠右 5%
              bottom: '5%',          // 靠下 5%
              textStyle: { 
                color: darkMode ? '#fff' : colors.primary, 
                fontWeight: 500 
              }
            },
            color: [colors.highlight, colors.secondary, colors.accent],
            series: [{
              name: '情感分布',
              type: 'pie',
              // 修正 2: 调整饼图大小和位置
              radius: '80%',                 // 将半径增大到80%，让饼图更大
              center: ['45%', '50%'],         // 将中心点向左移动，为右侧的图例留出空间
              data: pieData,
              // 优化: 让标签显示在外部，并带上百分比
              label: { 
                position: 'outer',
                formatter: '{b}: {d}%', // 格式为 "名称: 百分比%"
                color: darkMode ? '#ccc' : colors.primary
              },
              emphasis: { // 鼠标悬浮时的高亮效果
                itemStyle: {
                  shadowBlur: 10,
                  shadowOffsetX: 0,
                  shadowColor: 'rgba(0, 0, 0, 0.5)'
                }
              }
            }],
          });
        } else { setSentimentOptions(null); }
      } catch (error) { console.error('获取初始数据失败:', error); } finally { setLoading(false); }
    };
    fetchData();
    // ESLint 警告修正: 将 selectedKeyword 加入依赖项，确保逻辑完整
  }, [darkMode, timeRange, selectedKeyword]);

  // 获取关键词趋势数据
  useEffect(() => {
    const fetchKeywordTrend = async () => {
      if (!selectedKeyword) return;
      setTrendChartLoading(true);
      try {
        const response = await axios.get(`http://localhost:8000/api/trends/keyword/${selectedKeyword}`, { 
            params: { timeRange } 
        });
        if (response.data && response.data.dates && response.data.frequencies && response.data.dates.length > 0) {
          setTrendChartData({ xAxis: response.data.dates, series: [{ name: '热度', data: response.data.frequencies, type: 'line' }] });
        } else { setTrendChartData(null); }
      } catch (error) { 
        console.error(`获取关键词 "${selectedKeyword}" 趋势失败:`, error);
        setTrendChartData(null); 
      } finally { setTrendChartLoading(false); }
    };
    fetchKeywordTrend();
  }, [selectedKeyword, timeRange]);

  // 测量词云图容器尺寸
  useEffect(() => {
    // ESLint 警告修正: 将 ref.current 赋值给一个变量
    const currentRef = wordCloudWrapperRef.current;
    const resizeObserver = new ResizeObserver(entries => {
      if (entries && entries.length > 0 && entries[0].contentRect) {
        const { width, height } = entries[0].contentRect;
        setWordCloudSize({ width, height });
      }
    });
    if (currentRef) {
      resizeObserver.observe(currentRef);
    }
    return () => { 
      if (currentRef) { 
        resizeObserver.unobserve(currentRef); 
      } 
    };
  }, []); // 这个 effect 只在挂载和卸载时运行，所以依赖项为空数组是正确的

  const handleFontSize = (word) => Math.log2(word.value) * 6 + 14;
  const wordCloudColors = [colors.primary, colors.secondary, colors.accent, colors.highlight];
  const fill = (word, i) => wordCloudColors[i % wordCloudColors.length];

  return (
    <ErrorBoundary>
      <Spin spinning={loading} size="large">
        <div style={{ padding: '24px', background: darkMode ? '#121212' : '#f0f2f5', minHeight: '100vh' }}>
          {/* 顶部筛选区域 */}
          <Card style={{ marginBottom: '24px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', background: darkMode ? '#1e1e1e' : colors.cardBg, border: 'none' }}>
            <Row gutter={[16, 16]} align="middle">
              <Col><span style={{ fontWeight: 600, color: darkMode ? '#fff' : colors.primary, marginRight: '8px' }}>选择关键词：</span></Col>
              <Col flex="auto"><Select showSearch style={{ width: '100%' }} placeholder="搜索或选择一个关键词" optionFilterProp="children" onChange={setSelectedKeyword} value={selectedKeyword} filterOption={(input, option) => (option?.children ?? '').toLowerCase().includes(input.toLowerCase())} >{trendData.map(item => (<Select.Option key={item.text} value={item.text}>{item.text}</Select.Option>))}</Select></Col>
              <Col><span style={{ fontWeight: 600, color: darkMode ? '#fff' : colors.primary, marginRight: '8px' }}>时间范围：</span></Col>
              <Col><Select value={timeRange} onChange={setTimeRange} style={{ width: '120px' }}><Select.Option value="7d">近7天</Select.Option><Select.Option value="30d">近30天</Select.Option><Select.Option value="90d">近90天</Select.Option></Select></Col>
            </Row>
          </Card>

          {/* 关键词趋势图表 */}
          {selectedKeyword && (
            <Card title={`"${selectedKeyword}"的每日趋势`} style={{ marginBottom: '24px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', background: darkMode ? '#1e1e1e' : colors.cardBg, border: 'none' }} headStyle={{ background: colors.secondary, color: '#fff', fontWeight: 600, borderTopLeftRadius: '12px', borderTopRightRadius: '12px', padding: '0 24px' }} bodyStyle={{ padding: '24px', minHeight: '348px' }}>
              <Spin spinning={trendChartLoading}>
                {trendChartData ? (<ReactECharts option={{ tooltip: { trigger: 'axis' }, xAxis: { type: 'category', data: trendChartData.xAxis, axisLine: { lineStyle: { color: darkMode ? '#666' : '#ccc' } }, axisLabel: { color: darkMode ? '#999' : colors.primary } }, yAxis: { type: 'value', axisLine: { lineStyle: { color: darkMode ? '#666' : '#ccc' } }, axisLabel: { color: darkMode ? '#999' : colors.primary }, splitLine: { lineStyle: { color: darkMode ? '#444' : '#eee' } } }, series: trendChartData.series.map((s) => ({ ...s, smooth: true, lineStyle: { width: 3, color: colorPrimary }, itemStyle: { color: colorPrimary }, areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: darkMode ? `rgba(177, 59, 255, 0.5)` : `rgba(177, 59, 255, 0.7)` }, { offset: 1, color: `rgba(177, 59, 255, 0.1)` }]) } })), grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true } }} theme={darkMode ? 'dark' : 'light'} style={{ height: '300px' }} />) : (<div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px'}}><Empty description="暂无趋势数据" /></div>)}
              </Spin>
            </Card>
          )}

          <Row gutter={[24, 24]}>
            <Col span={24}><Card style={{ borderRadius: '12px', background: darkMode ? '#1e1e1e' : colors.cardBg, border: 'none' }} headStyle={{ background: colors.primary, color: '#fff', fontWeight: 600, borderTopLeftRadius: '12px', borderTopRightRadius: '12px', padding: '0 24px' }} title="最新新闻动态" bodyStyle={{ padding: '0' }} ><Table columns={columns} dataSource={newsData} rowKey="id" pagination={{ pageSize: 5 }} /></Card></Col>
            <Col xs={24} lg={16}><Card style={{ borderRadius: '12px', background: darkMode ? '#1e1e1e' : colors.cardBg, border: 'none', height: '500px', display: 'flex', flexDirection: 'column' }} headStyle={{ background: colors.secondary, color: '#fff', fontWeight: 600, borderTopLeftRadius: '12px', borderTopRightRadius: '12px', padding: '0 24px', flexShrink: 0 }} bodyStyle={{ flexGrow: 1, padding: '24px', overflow: 'hidden' }} title="热门关键词云" ><div ref={wordCloudWrapperRef} style={{ width: '100%', height: '100%' }}>{trendData.length > 0 && wordCloudSize.width > 0 ? (<WordCloud data={trendData} width={wordCloudSize.width} height={wordCloudSize.height} font="sans-serif" fontSize={handleFontSize} fill={fill} rotate={0} padding={2} onWordClick={(event, d) => { setSelectedKeyword(d.text); }} />) : (<div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%'}}><Empty description={loading ? '加载中...' : '暂无趋势数据'} /></div>)}</div></Card></Col>
            
            {/* --- 就是这里！--- */}
            <Col xs={24} lg={8}>
              <Card 
                style={{ borderRadius: '12px', background: darkMode ? '#1e1e1e' : colors.cardBg, border: 'none', height: '500px' }} 
                headStyle={{ background: colors.accent, color: '#fff', fontWeight: 600, borderTopLeftRadius: '12px', borderTopRightRadius: '12px', padding: '0 24px' }} 
                title="新闻情感分布" 
                bodyStyle={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }} 
              >
                {sentimentOptions ? (
                  <ReactECharts 
                    option={sentimentOptions} 
                    theme={darkMode ? 'dark' : 'light'} 
                    // 关键修改：将 height 的 '100%' 改为具体的像素值
                    style={{ height: '420px', width: '100%' }} 
                  />
                ) : (
                  <Empty description="暂无情感数据" />
                )}
              </Card>
            </Col>
          </Row>
        </div>
      </Spin>
    </ErrorBoundary>
  );
};

export default Dashboard;
