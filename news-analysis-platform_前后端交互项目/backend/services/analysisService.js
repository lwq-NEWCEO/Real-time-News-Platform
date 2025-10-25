// backend/services/analysisService.js
const pool = require('../models/db');

async function analyzeAndPopulateTrends() {
  console.log('🚀 开始分析新闻数据并填充 trends 表...');
  const client = await pool.connect();

  try {
    // 获取所有新闻，我们需要它们的关键词和发布日期
    const newsResult = await client.query('SELECT keywords, published_at FROM news');
    if (newsResult.rows.length === 0) {
      console.log('📰 news 表中没有可供分析的新闻。');
      return;
    }

    // 使用一个对象来聚合数据，避免频繁查询数据库
    // 结构: { '2024-05-21': { 'tech': 1, 'ai': 2 }, ... }
    const dailyKeywordCounts = {};

    for (const news of newsResult.rows) {
      // 确保有关键词和日期
      if (!news.keywords || news.keywords.length === 0 || !news.published_at) {
        continue;
      }

      // 将时间戳转换为 'YYYY-MM-DD' 格式的日期字符串
      const date = new Date(news.published_at).toISOString().split('T')[0];

      if (!dailyKeywordCounts[date]) {
        dailyKeywordCounts[date] = {};
      }

      for (const keyword of news.keywords) {
        if (!dailyKeywordCounts[date][keyword]) {
          dailyKeywordCounts[date][keyword] = 0;
        }
        dailyKeywordCounts[date][keyword]++;
      }
    }

    // 现在，将聚合好的数据批量写入 trends 表
    await client.query('BEGIN'); // 开始事务

    // 使用 INSERT ... ON CONFLICT (UPSERT) 语法
    // 如果 (keyword, date) 组合已存在，则更新其 frequency
    const upsertQuery = `
      INSERT INTO trends (keyword, date, frequency)
      VALUES ($1, $2, $3)
      ON CONFLICT (keyword, date) DO UPDATE
      SET frequency = trends.frequency + EXCLUDED.frequency;
    `;

    let entriesProcessed = 0;
    for (const [date, keywords] of Object.entries(dailyKeywordCounts)) {
      for (const [keyword, count] of Object.entries(keywords)) {
        await client.query(upsertQuery, [keyword, date, count]);
        entriesProcessed++;
      }
    }
    
    await client.query('COMMIT'); // 提交事务
    console.log(`✅ 分析完成！成功处理并更新了 ${entriesProcessed} 条趋势记录。`);

  } catch (error) {
    await client.query('ROLLBACK'); // 如果出错，回滚事务
    console.error('❌ 在分析和填充 trends 表时发生错误:', error);
    throw error; // 抛出错误，让调用者知道失败了
  } finally {
    client.release(); // 释放数据库连接
  }
}

module.exports = { analyzeAndPopulateTrends };
