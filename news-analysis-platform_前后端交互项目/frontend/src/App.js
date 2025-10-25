import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Layout, Menu, Switch, Typography, ConfigProvider, theme } from 'antd';
import { BarChartOutlined, HomeOutlined, BulbOutlined, BulbFilled } from '@ant-design/icons';

// 导入页面组件
import Dashboard from './pages/Dashboard';
import Trends from './pages/Trends';
import NewsDetail from './pages/NewsDetail';

const { Header, Content, Footer, Sider } = Layout;
const { Title } = Typography;

const AppContent = () => {
  const [darkMode, setDarkMode] = useState(true);
  const location = useLocation();

  const {
    token: { colorBgContainer, colorPrimary },
  } = theme.useToken();

  // 根据当前路由确定菜单选中项
  const getSelectedKeys = () => {
    const path = location.pathname;
    return path.startsWith('/trends') ? ['/trends'] : ['/'];
  };

  return (
    <ConfigProvider
      theme={{
        algorithm: darkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#1890ff', // 确保与图表颜色一致
        },
      }}
    >
      <Layout style={{ minHeight: '100vh' }}>
        <Sider collapsible>
          <div
            style={{
              height: '32px',
              margin: '16px',
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '6px',
            }}
          />
          <Menu theme="dark" selectedKeys={getSelectedKeys()} mode="inline">
            <Menu.Item key="/" icon={<HomeOutlined />}>
              <Link to="/">主看板</Link>
            </Menu.Item>
            <Menu.Item key="/trends" icon={<BarChartOutlined />}>
              <Link to="/trends">趋势分析</Link>
            </Menu.Item>
          </Menu>
        </Sider>
        <Layout>
          <Header
            style={{
              padding: '0 24px',
              background: colorBgContainer,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Title level={4} style={{ margin: 0 }}>
              实时新闻分析平台
            </Title>
            <Switch
              checkedChildren={<BulbFilled />}
              unCheckedChildren={<BulbOutlined />}
              checked={darkMode}
              onChange={setDarkMode}
            />
          </Header>
          <Content style={{ margin: '24px 16px 0', overflow: 'initial' }}>
            <div
              style={{
                padding: 24,
                minHeight: 'calc(100vh - 180px)',
                background: colorBgContainer,
                borderRadius: '8px',
              }}
            >
              <Routes>
                <Route path="/" element={<Dashboard darkMode={darkMode} colorPrimary={colorPrimary} />} />
                <Route path="/trends" element={<Trends darkMode={darkMode} colorPrimary={colorPrimary} />} />
                <Route path="/news/:id" element={<NewsDetail darkMode={darkMode} colorPrimary={colorPrimary} />} />
              </Routes>
            </div>
          </Content>
          <Footer style={{ textAlign: 'center' }}>
            实时新闻分析平台 ©2025
          </Footer>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
};

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;