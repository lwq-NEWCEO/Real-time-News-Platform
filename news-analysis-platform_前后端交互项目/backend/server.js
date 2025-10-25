// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { fetchNews } = require('./crawlers/newsCrawler');
const { analyzeAndPopulateTrends } = require('./services/analysisService'); // <-- 引入新服务

const newsRoutes = require('./routes/news');
const trendsRoutes = require('./routes/trends');
const sentimentsRoutes = require('./routes/sentiments');
const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/news', newsRoutes);
app.use('/api/trends', trendsRoutes);
app.use('/api/sentiments', sentimentsRoutes); 
// 升级版的手动触发 API
app.post('/api/fetch-news', async (req, res) => {
    try {
        console.log('--- 开始手动数据更新流程 ---');
        
        // 第1步：抓取新闻
        console.log('1/2: 正在抓取最新新闻...');
        await fetchNews();
        console.log('👍 新闻抓取成功。');

        // 第2步：分析新闻并填充趋势表
        console.log('2/2: 正在分析新闻并更新趋势...');
        await analyzeAndPopulateTrends();
        console.log('👍 趋势分析完成。');
        
        console.log('--- 数据更新流程全部完成 ---');
        res.json({ message: 'News fetched and analyzed successfully' });
    } catch (err) {
        console.error('数据更新流程失败:', err.stack);
        res.status(500).json({ error: 'Failed to fetch or analyze data' });
    }
});

const PORT = 8000;
app.listen(PORT, async () => {
    console.log(`✅ 后端服务已启动，运行在端口 ${PORT}`);
    
    // 启动时自动运行一次完整的数据更新流程
    try {
        console.log('--- 服务启动，将自动执行一次数据更新 ---');
        await fetchNews();
        await analyzeAndPopulateTrends();
        console.log('--- 启动时数据更新完成 ---');
    } catch (err) {
        console.error('启动时数据更新失败:', err.stack);
    }
});
