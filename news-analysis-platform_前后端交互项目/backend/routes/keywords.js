// backend/routes/keywords.js
const express = require('express');
const pool = require('../models/db');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 50;
    const timeRange = req.query.timeRange || '7d';

    // 计算起始日期
    const startDate = new Date();
    const days = parseInt(timeRange);
    if (isNaN(days)) {
      return res.status(400).json({ error: 'Invalid timeRange parameter' });
    }
    startDate.setDate(startDate.getDate() - days);

    const query = `
      SELECT
        keyword,
        SUM(frequency)::INTEGER AS frequency
      FROM trends
      WHERE date >= $1
      GROUP BY keyword
      ORDER BY frequency DESC
      LIMIT $2;
    `;

    const result = await pool.query(query, [startDate, limit]);
    res.json(result.rows);

  } catch (err) {
    console.error('获取关键词数据失败:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

module.exports = router;