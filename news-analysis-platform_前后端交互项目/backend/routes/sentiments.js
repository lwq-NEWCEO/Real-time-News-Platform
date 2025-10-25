// backend/routes/sentiments.js
const express = require('express');
const router = express.Router();
const pool = require('../models/db');

// 获取情感分布数据 (用于饼图或柱状图)
router.get('/', async (req, res) => {
  try {
    // 这条SQL查询非常高效：直接在数据库中完成统计
    const query = `
      SELECT 
        sentiment, 
        COUNT(*)::INTEGER AS count 
      FROM sentiments  -- <-- 【修复点】这里从 'news' 改为了 'sentiments'
      GROUP BY sentiment;
    `;
    
    const result = await pool.query(query);

    // 返回一个干净的数组
    res.json(result.rows);

  } catch (err) {
    // 我们可以移除 .stack 让日志更干净，除非需要深度调试
    console.error('--- 情感数据API出错 ---', err.message); 
    res.status(500).json({ error: '服务器在获取情感数据时发生错误' });
  }
});

module.exports = router;
