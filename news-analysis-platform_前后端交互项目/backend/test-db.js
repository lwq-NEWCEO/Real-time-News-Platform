// backend/test-db.js
const pool = require('./models/db');

async function testQuery() {
    try {
        const result = await pool.query('SELECT * FROM news');
        console.log('News data:', result.rows);
    } catch (err) {
        console.error('Query error:', err.stack);
    }
}

testQuery();