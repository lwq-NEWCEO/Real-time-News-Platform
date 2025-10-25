// frontend/src/pages/Home.js
import React from 'react';
import NewsTable from '../components/NewsTable';
import TrendChart from '../components/TrendChart';
import WordCloudComponent from '../components/WordCloud';
import SentimentChart from '../components/SentimentChart';

const Home = () => {
    return (
        <div>
            <h1>News Analysis Platform</h1>
            <NewsTable />
            <TrendChart />
            <WordCloudComponent />
            <SentimentChart />
        </div>
    );
};

export default Home;