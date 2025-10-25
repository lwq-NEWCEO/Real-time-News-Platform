-- database/seed.sql
\c news_db;

INSERT INTO news (title, source, content, published_at, url, keywords)
VALUES
    (
        'Global Markets Surge as Tech Stocks Rally',
        'BBC',
        'Technology stocks led a global market rally today...',
        '2025-07-10 10:00:00',
        'https://www.bbc.com/news/sample1',
        ARRAY['tech', 'stocks', 'market']
    ),
    (
        'New Climate Policy Announced',
        'Guardian',
        'Governments unveiled a new climate policy to reduce emissions...',
        '2025-07-09 15:30:00',
        'https://www.theguardian.com/news/sample2',
        ARRAY['climate', 'policy', 'emissions']
    );

INSERT INTO trends (keyword, frequency, date)
VALUES
    ('tech', 10, '2025-07-10'),
    ('climate', 8, '2025-07-10'),
    ('stocks', 5, '2025-07-10');

INSERT INTO sentiments (news_id, sentiment, score)
VALUES
    (1, 'Positive', 0.5),
    (2, 'Neutral', 0.0);