import React, { useState, useEffect, useRef } from 'react'; // 优化: 引入 useRef
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import { Wordcloud } from '@visx/wordcloud';
import { Text } from '@visx/text';
import { scaleLog } from '@visx/scale';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend
} from 'chart.js';
import {
  Row, Col, Card, Select, Radio, Spin, Empty, Typography, message
} from 'antd';

// Chart.js 注册 (无改动)
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const { Paragraph } = Typography;

const colors = {
  primary: '#090040',
  secondary: '#471396',
  accent: '#B13BFF',
  highlight: '#FFCC00',
  lightBg: '#f9fafb',
  cardBg: '#ffffff',
};

const Trends = ({ darkMode }) => {
  const [trends, setTrends] = useState([]);
  const [keywords, setKeywords] = useState([]);
  const [wordCloudData, setWordCloudData] = useState([]);
  const [selectedKeyword, setSelectedKeyword] = useState(null);
  const [timeRange, setTimeRange] = useState('7d');
  const [loading, setLoading] = useState(false);

  // 优化: 为词云图添加 ref 和 size state
  const wordCloudWrapperRef = useRef(null);
  const [wordCloudSize, setWordCloudSize] = useState({ width: 0, height: 0 });

  // 获取关键词列表和词云数据
  useEffect(() => {
    const fetchKeywords = async () => {
      setLoading(true);
      try {
        // 修正: 添加了 http://localhost:8000
        const res = await axios.get('http://localhost:8000/api/trends/keywords', { params: { timeRange, limit: 100 } });
        const uniqueKeywords = [...new Set(res.data.map(item => item.keyword.trim()).filter(Boolean))];
        setKeywords(uniqueKeywords.map(kw => ({ value: kw, label: kw })));
        const formattedKeywords = res.data.map(item => ({
          text: item.keyword,
          value: item.total_frequency,
        }));
        setWordCloudData(formattedKeywords);
        if (uniqueKeywords.length > 0 && selectedKeyword === null) {
          setSelectedKeyword(uniqueKeywords[0]);
        }
      } catch (err) {
        console.error('获取关键词列表失败:', err);
        message.error('无法加载关键词列表');
      } finally {
        setLoading(false);
      }
    };
    fetchKeywords();
  }, [timeRange]);

  // 获取每日趋势数据（柱状图）
  useEffect(() => {
    const fetchTrendDetails = async () => {
      if (!selectedKeyword) return;
      setLoading(true);
      try {
        // 修正: 添加了 http://localhost:8000
        const res = await axios.get(`http://localhost:8000/api/trends/keyword/${selectedKeyword}`, {
          params: { timeRange },
        });
        if (res.data && res.data.dates && res.data.frequencies) {
          setTrends(res.data);
        } else {
          setTrends([]);
          message.warning(`关键词 "${selectedKeyword}" 暂无趋势数据`);
        }
      } catch (err) {
        console.error('获取趋势详情失败:', err);
        message.error(`获取"${selectedKeyword}"的趋势数据失败`);
        setTrends([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTrendDetails();
  }, [selectedKeyword, timeRange]);

  // 优化: 测量词云图容器的尺寸
  useEffect(() => {
    const resizeObserver = new ResizeObserver(entries => {
      if (entries && entries.length > 0 && entries[0].contentRect) {
        const { width, height } = entries[0].contentRect;
        setWordCloudSize({ width, height });
      }
    });
    if (wordCloudWrapperRef.current) {
      resizeObserver.observe(wordCloudWrapperRef.current);
    }
    return () => { if (wordCloudWrapperRef.current) { resizeObserver.unobserve(wordCloudWrapperRef.current); } };
  }, []);

  // 词云配置 (无改动)
  const fontScale = scaleLog({
    domain: [Math.min(...wordCloudData.map(w => w.value || 1)), Math.max(...wordCloudData.map(w => w.value || 1))],
    range: [20, 70],
  });

  // Chart.js 配置 (无改动)
  const chartData = {
    labels: trends.dates ? trends.dates.map(t => new Date(t).toLocaleDateString()) : [],
    datasets: [{
      label: `${selectedKeyword || '关键词'} 每日提及次数`,
      data: trends.frequencies || [],
      backgroundColor: darkMode ? 'rgba(71, 19, 150, 0.6)' : 'rgba(177, 59, 255, 0.6)',
      borderColor: darkMode ? '#471396' : '#B13BFF',
      borderWidth: 1,
    }],
  };
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false, // 优化: 允许图表填充容器高度
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: `关键词 "${selectedKeyword || '请选择关键词'}" 趋势分析` },
    },
    scales: { y: { beginAtZero: true } },
  };

  return (
    <div style={{ maxWidth: '1200px', margin: 'auto', padding: '24px' }}>
      <Row gutter={[24, 24]}>
        {/* 控制器区域 (无改动) */}
        <Col span={24}>
          <Card style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', background: darkMode ? '#1e1e1e' : colors.cardBg, border: 'none' }}>
            <Row align="middle" gutter={16}>
              <Col><Paragraph style={{ margin: 0, fontWeight: 500, color: darkMode ? '#fff' : colors.primary }}>选择关键词:</Paragraph></Col>
              <Col flex="auto"><Select showSearch value={selectedKeyword} onChange={(value) => setSelectedKeyword(value)} options={keywords} placeholder="搜索或选择一个关键词" style={{ width: '100%', minWidth: '200px' }} loading={keywords.length === 0} /></Col>
              <Col><Paragraph style={{ margin: 0, fontWeight: 500, color: darkMode ? '#fff' : colors.primary }}>时间范围:</Paragraph></Col>
              <Col><Radio.Group value={timeRange} onChange={(e) => setTimeRange(e.target.value)}><Radio.Button value="7d">近7天</Radio.Button><Radio.Button value="30d">近30天</Radio.Button><Radio.Button value="90d">近90天</Radio.Button></Radio.Group></Col>
            </Row>
          </Card>
        </Col>

        {/* 词云 */}
        <Col xs={24} lg={12}>
          <Card title="热门关键词云" style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', background: darkMode ? '#1e1e1e' : colors.cardBg, border: 'none', height: '480px' /* 优化: 固定高度以对齐 */, display: 'flex', flexDirection: 'column' }} headStyle={{ background: colors.secondary, color: '#fff', fontWeight: 600, borderTopLeftRadius: '12px', borderTopRightRadius: '12px', padding: '0 24px', flexShrink: 0 }} bodyStyle={{ flexGrow: 1, padding: '24px', overflow: 'hidden' }}>
            <Spin spinning={loading}>
              {/* 优化: 使用 div 包裹以进行尺寸测量 */}
              <div ref={wordCloudWrapperRef} style={{ width: '100%', height: '100%' }}>
                {wordCloudData.length > 0 && wordCloudSize.width > 0 ? (
                  <Wordcloud
                    words={wordCloudData}
                    width={wordCloudSize.width}   // 优化: 使用动态宽度
                    height={wordCloudSize.height} // 优化: 使用动态高度
                    fontSize={word => fontScale(word.value)}
                    font={'Impact'}
                    padding={2}
                    rotate={0}
                    spiral="rectangular"
                  >
                    {word => (
                      <Text key={word.text} fill={darkMode ? colors.highlight : colors.primary} textAnchor="middle" transform={`translate(${word.x}, ${word.y}) rotate(${word.rotate})`} fontSize={word.size} fontFamily={word.font}>
                        {word.text}
                      </Text>
                    )}
                  </Wordcloud>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <Empty description="暂无趋势数据" />
                  </div>
                )}
              </div>
            </Spin>
          </Card>
        </Col>

        {/* 柱状图 */}
        <Col xs={24} lg={12}>
          <Card title={`"${selectedKeyword || '请选择关键词'}" 的每日趋势`} style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', background: darkMode ? '#1e1e1e' : colors.cardBg, border: 'none', height: '480px' /* 优化: 固定高度以对齐 */ }} headStyle={{ background: colors.secondary, color: '#fff', fontWeight: 600, borderTopLeftRadius: '12px', borderTopRightRadius: '12px', padding: '0 24px' }}>
            <Spin spinning={loading}>
              <div style={{ height: '400px', position: 'relative' }}>
                {trends.dates && trends.dates.length > 0 ? (
                  <Bar options={chartOptions} data={chartData} />
                ) : (
                   <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <Empty description="暂无数据或未选择关键词" />
                  </div>
                )}
              </div>
            </Spin>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Trends;
