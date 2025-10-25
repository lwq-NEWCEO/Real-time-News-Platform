// backend/routes/news.js
const express = require('express');
const pool = require('../models/db');
const router = express.Router();

/**
 * @route   GET /api/news
 * @desc    获取新闻列表，支持分页、搜索、筛选和排序
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      keyword,
      source,
      sortBy = 'n.published_at',
      sortOrder = 'DESC',
    } = req.query;

    const offset = (page - 1) * limit;
    
    // --- 安全地构建动态查询 ---
    let whereClauses = [];
    let queryParams = [];
    let paramIndex = 1;

    if (keyword) {
      // 使用 ILIKE 进行不区分大小写的模糊搜索
      whereClauses.push(`n.title ILIKE $${paramIndex++}`);
      queryParams.push(`%${keyword}%`);
    }

    if (source) {
      whereClauses.push(`n.source = $${paramIndex++}`);
      queryParams.push(source);
    }

    const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // --- 安全地处理排序 ---
    // 使用白名单防止SQL注入
    const allowedSortBy = ['n.published_at', 'n.source', 's.sentiment'];
    const safeSortBy = allowedSortBy.includes(sortBy) ? sortBy : 'n.published_at';
    const safeSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // 主查询
    const dataQuery = `
      SELECT n.id, n.title, n.source, n.published_at, n.keywords, s.sentiment
      FROM news n
      LEFT JOIN sentiments s ON n.id = s.news_id
      ${whereString}
      ORDER BY ${safeSortBy} ${safeSortOrder}
      LIMIT $${paramIndex++} OFFSET $${paramIndex++};
    `;

    const dataResult = await pool.query(dataQuery, [...queryParams, limit, offset]);

    // 计数查询
    const countQuery = `
      SELECT COUNT(n.id) AS total
      FROM news n
      ${whereString};
    `;
    const countResult = await pool.query(countQuery, queryParams);
    const totalCount = parseInt(countResult.rows[0].total, 10);
    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      data: dataResult.rows,
      pagination: {
        currentPage: parseInt(page, 10),
        totalPages,
        totalCount,
      },
    });

  } catch (err) {
    console.error('获取新闻列表失败:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

/**
 * @route   GET /api/news/sources
 * @desc    获取所有不重复的新闻来源
 * @access  Public
 */
router.get('/sources', async (req, res) => {
  try {
    const result = await pool.query('SELECT DISTINCT source FROM news WHERE source IS NOT NULL ORDER BY source ASC');
    res.json(result.rows.map(row => row.source));
  } catch (err) {
    console.error('获取新闻来源失败:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 您原有的新闻详情路由 (如果需要的话，也一并保留)
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            'SELECT n.*, s.sentiment, s.score FROM news n JOIN sentiments s ON n.id = s.news_id WHERE n.id = $1',
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'News not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(`获取ID为 ${id} 的新闻详情失败:`, err);
        res.status(500).json({ error: err.message });
    }
});


module.exports = router;
