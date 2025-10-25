// backend/routes/trends.js
const express = require('express');
const router = express.Router();
const pool = require('../models/db');

// 获取单个关键词的趋势数据
router.get('/keyword/:keyword', async (req, res) => {
  try {
    const { keyword } = req.params;
    const timeRange = req.query.timeRange || '7d';

    // 计算起始日期
    const startDate = new Date();
    const days = parseInt(timeRange.replace('d', ''));
    if (isNaN(days)) {
      return res.status(400).json({ error: 'Invalid timeRange parameter' });
    }
    startDate.setDate(startDate.getDate() - days);

    const query = `
      SELECT 
        date,
        frequency
      FROM trends
      WHERE keyword = $1 AND date >= $2
      ORDER BY date ASC;
    `;

    const result = await pool.query(query, [keyword, startDate]);
    
    // 格式化数据
    const dates = result.rows.map(row => 
      new Date(row.date).toLocaleDateString()
    );
    const frequencies = result.rows.map(row => parseInt(row.frequency));

    res.json({
      keyword,
      dates,
      frequencies
    });

  } catch (err) {
    console.error('获取关键词趋势失败:', err.stack);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 获取关键词趋势数据（按天聚合）
router.get('/', async (req, res) => {
  const { timeRange = '30d' } = req.query;

  try {
    const days = parseInt(timeRange.replace('d', ''));
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const query = `
      SELECT
        DATE(date) AS date,
        SUM(frequency)::INTEGER AS frequency
      FROM trends
      WHERE date >= $1
      GROUP BY DATE(date)
      ORDER BY DATE(date) ASC;
    `;
    
    const params = [startDate];
    
    const result = await pool.query(query, params);

    res.json({
      data: result.rows,
      pagination: { totalCount: result.rowCount }
    });

  } catch (err) {
    console.error('--- 趋势数据API出错 ---');
    console.error(err.stack);
    res.status(500).json({ error: '服务器在获取趋势数据时发生错误' });
  }
});

// 获取热门关键词（用于词云）
router.get('/keywords', async (req, res) => {
  const { limit = 50, timeRange = '7d' } = req.query;

  try {
    const days = parseInt(timeRange.replace('d', ''));
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const query = `
      SELECT
        keyword,
        SUM(frequency)::INTEGER AS total_frequency
      FROM trends
      WHERE date >= $1
      GROUP BY keyword
      ORDER BY total_frequency DESC
      LIMIT $2;
    `;
    
    const params = [startDate, limit];
    
    const result = await pool.query(query, params);

    res.json(result.rows);

  } catch (err) {
    console.error('--- 词云数据API出错 ---');
    console.error(err.stack);
    res.status(500).json({ error: '服务器在获取词云数据时发生错误' });
  }
});

module.exports = router;