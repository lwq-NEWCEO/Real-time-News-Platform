// backend/crawlers/newsCrawler.js

// 1. 明确.env文件的路径，因为脚本是从根目录启动的
// 这样可以确保无论从哪里运行，都能正确加载环境变量
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const axios = require('axios');
const https = require('https'); // <-- 这是正确的一行
const pool = require('../models/db');
const { extractKeywords, analyzeSentiment } = require('../utils/nlp');

// 检查API密钥是否已加载
const NEWS_API_KEY = process.env.NEWS_API_KEY;
if (!NEWS_API_KEY) {
    console.error("错误: 未在 .env 文件中找到 NEWS_API_KEY。");
    process.exit(1); // 如果没有API密钥，则退出脚本
}
const NEWS_API_URL = 'https://newsapi.org/v2/top-headlines';

// 2. 将代理配置和Axios实例提取出来，方便管理
const proxyConfig = {
    protocol: 'http', // 你的代理协议，通常是 http
    host: '127.0.0.1',
    port: 7897, // 注意: 我将端口改回了常见的7890，如果你的确实是7897，请改回去
};

const axiosInstance = axios.create({
    timeout: 30000, // 30秒超时
    httpsAgent: new https.Agent({ rejectUnauthorized: false }), // 忽略SSL证书错误，处理某些网络环境
    proxy: process.env.USE_PROXY === 'true' ? proxyConfig : false, // 通过环境变量控制是否使用代理
});

// 3. 优化重试逻辑
const retryRequest = async (url, params, retries = 3, backoff = 2000) => {
    for (let i = 0; i < retries; i++) {
        try {
            // 使用我们配置好的 axios 实例
            const response = await axiosInstance.get(url, { params });
            return response;
        } catch (err) {
            // 包含更多常见的网络错误类型
            if (['ETIMEDOUT', 'ECONNRESET', 'ECONNREFUSED', 'ENOTFOUND'].includes(err.code) && i < retries - 1) {
                console.warn(`[网络错误] 尝试 ${i + 1}/${retries} 失败，错误: ${err.code}。将在 ${backoff}ms 后重试...`);
                await new Promise(resolve => setTimeout(resolve, backoff));
                backoff *= 2; // 指数退避
            } else {
                // 如果是最后一次尝试或非网络错误，则直接抛出
                throw err;
            }
        }
    }
};

async function fetchNews() {
    console.log('开始获取新闻...');
    try {
        const response = await retryRequest(NEWS_API_URL, {
            country: 'us',
            apiKey: NEWS_API_KEY,
        });

        const articles = response.data.articles;
        if (!articles || articles.length === 0) {
            console.log("未获取到新文章。");
            return;
        }

        console.log(`成功获取到 ${articles.length} 篇文章，正在处理...`);

        for (const article of articles) {
            // 确保文章有标题和URL，否则跳过
            if (!article.title || !article.url) continue;

            const { title, source, content, publishedAt, url } = article;
            const keywords = extractKeywords(title + ' ' + (content || ''));
            const { sentiment, score } = analyzeSentiment(content || title);

            const newsResult = await pool.query(
                `INSERT INTO news (title, source, content, published_at, url, keywords)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 ON CONFLICT (url) DO NOTHING -- 使用url作为唯一性约束，防止重复插入
                 RETURNING id`,
                [title, source.name, content || '', new Date(publishedAt), url, keywords]
            );

            // 只有在新文章被成功插入时，才进行后续操作
            if (newsResult.rows.length > 0) {
                const newsId = newsResult.rows[0].id;
                await pool.query(
                    `INSERT INTO sentiments (news_id, sentiment, score)
                     VALUES ($1, $2, $3)`,
                    [newsId, sentiment, score]
                );

                for (const keyword of keywords) {
                    await pool.query(
                        `INSERT INTO trends (keyword, frequency, date)
                         VALUES ($1, 1, $2) -- 频率从1开始
                         ON CONFLICT (keyword, date)
                         DO UPDATE SET frequency = trends.frequency + 1`,
                        [keyword, new Date(publishedAt).toISOString().split('T')[0]]
                    );
                }
            }
        }
        console.log('新闻处理并存储成功！');
    } catch (err) {
        console.error('获取或处理新闻时发生严重错误:', err.message);
        if (err.response) {
            // API返回的错误 (如 4xx, 5xx)
            console.error('NewsAPI 响应详情:', err.response.data);
        } else {
            // 网络错误或其他代码错误
            console.error('错误详情:', {
                code: err.code,
                message: err.message,
                // stack: err.stack, // 堆栈信息太长，调试时可打开
            });
        }
    }
}

// 立即执行一次，然后设置定时器
(async () => {
    // 4. 在启动时检查数据库连接
    try {
        const client = await pool.connect();
        console.log('数据库连接成功！');
        client.release();
    } catch (dbError) {
        console.error('致命错误: 无法连接到数据库。请检查 .env 配置和数据库服务状态。');
        console.error('数据库错误详情:', dbError.message);
        process.exit(1); // 无法连接数据库，脚本无法工作，直接退出
    }

    await fetchNews(); // 立即执行第一次
    
    const intervalMinutes = 60;
    console.log(`设置定时器，每 ${intervalMinutes} 分钟运行一次。`);
    setInterval(fetchNews, intervalMinutes * 60 * 1000); // 每小时执行一次
})();


module.exports = { fetchNews };

