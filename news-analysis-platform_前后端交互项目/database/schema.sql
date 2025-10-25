-- database/schema.sql
\c news_db;

CREATE TABLE news (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    source VARCHAR(100) NOT NULL,
    content TEXT,
    published_at TIMESTAMP,
    url VARCHAR(255),
    keywords TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE trends (
    id SERIAL PRIMARY KEY,
    keyword VARCHAR(100) NOT NULL,
    frequency INT NOT NULL,
    date DATE NOT NULL,
    UNIQUE(keyword, date)
);

CREATE TABLE sentiments (
    id SERIAL PRIMARY KEY,
    news_id INT REFERENCES news(id) ON DELETE CASCADE,
    sentiment VARCHAR(20),
    score FLOAT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_news_published_at ON news(published_at);
CREATE INDEX idx_trends_keyword ON trends(keyword);