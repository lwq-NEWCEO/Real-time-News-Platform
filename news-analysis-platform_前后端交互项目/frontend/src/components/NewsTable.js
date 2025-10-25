import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { FaSearch, FaSort } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const NewsTable = () => {
  const [newsData, setNewsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSource, setSelectedSource] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [sortBy, setSortBy] = useState('n.published_at'); // 修改为表前缀格式
  const [sortOrder, setSortOrder] = useState('DESC');
  const [sources, setSources] = useState([]);

  const sentimentColors = {
    positive: 'bg-green-100 text-green-800',
    neutral: 'bg-gray-100 text-gray-800',
    negative: 'bg-red-100 text-red-800',
    default: 'bg-gray-100 text-gray-800'
  };

  // 筛选条件变化时重置页码
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedSource, sortBy, sortOrder]);

  // 获取新闻数据
  const fetchNews = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/news', {
        params: {
          page: currentPage,
          limit: 10,
          keyword: searchTerm, // 修改为 keyword 匹配后端
          source: selectedSource,
          sortBy,
          sortOrder,
        },
      });
      
      // 增强容错处理
      if (!response.data || !Array.isArray(response.data.data)) {
        throw new Error('响应格式不正确');
      }
      
      setNewsData(response.data.data);
      setTotalPages(response.data.pagination?.totalPages || 1);
      setTotalCount(response.data.pagination?.totalCount || 0);
      setError(null);
    } catch (err) {
      console.error('获取新闻失败', err);
      const errMsg = err.response?.data?.error || `网络错误：${err.message}`;
      setError(`新闻加载失败：${errMsg}`);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, selectedSource, sortBy, sortOrder]);

  // 获取新闻来源
  const fetchSources = useCallback(async () => {
  try {
    const response = await axios.get('/api/news/sources');
    if (Array.isArray(response.data)) {
      setSources(['', ...Array.from(new Set(response.data))]);
    } else {
      throw new Error('来源数据格式错误'); // 增强校验
    }
  } catch (err) {
    console.error('来源加载失败：', err);
    setError('来源列表加载失败，筛选功能可能异常');
    // 兜底：设置空来源，避免页面卡死
    setSources(['']); 
  }
}, []);

  // 数据加载
  useEffect(() => {
    fetchNews();
    fetchSources();
  }, [fetchNews, fetchSources]);

  // 切换排序
  const toggleSort = (field) => {
    // 映射前端字段到数据库字段
    const fieldMap = {
      'published_at': 'n.published_at',
      'source': 'n.source',
      'sentiment': 's.sentiment'
    };
    
    const dbField = fieldMap[field] || 'n.published_at';
    
    if (sortBy === dbField) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(dbField);
      setSortOrder('DESC');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-6">
      {/* 搜索和筛选栏 */}
      <div className="p-4 border-b flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="搜索新闻标题..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          />
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>
        
        <div className="flex flex-wrap gap-4">
          <select
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          >
            <option value="">所有来源</option>
            {sources.map((source) => (
              <option key={source} value={source}>{source}</option>
            ))}
          </select>
          
          <select
            value={sortBy === 'n.published_at' ? 'published_at' : sortBy === 'n.source' ? 'source' : 'sentiment'}
            onChange={(e) => toggleSort(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          >
            <option value="published_at">发布时间</option>
            <option value="source">来源</option>
          </select>
          
          <button
            onClick={() => toggleSort(sortBy === 'n.published_at' ? 'published_at' : sortBy === 'n.source' ? 'source' : 'sentiment')}
            className="flex items-center gap-2 border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-100 transition-colors"
          >
            <FaSort />
            <span>{sortOrder === 'ASC' ? '升序' : '降序'}</span>
          </button>
        </div>
      </div>

      {/* 新闻表格 */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">标题</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">来源</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">发布时间</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">情感</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center">加载中...</td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-red-500">{error}</td>
              </tr>
            ) : newsData.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center">没有找到匹配的新闻</td>
              </tr>
            ) : (
              newsData.map((news) => (
                <tr key={news.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{news.title}</div>
                    <div className="text-gray-500 text-sm">
                      {news.keywords && news.keywords.length > 0 ? (
                        <span className="flex flex-wrap gap-1 mt-1">
                          {news.keywords.slice(0, 3).map((keyword, index) => (
                            <span key={index} className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                              {keyword}
                            </span>
                          ))}
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{news.source || '未知来源'}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {news.published_at ? new Date(news.published_at).toLocaleString() : '未知时间'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      sentimentColors[news.sentiment] || sentimentColors.default
                    }`}>
                      {news.sentiment || '未知'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <Link to={`/news/${news.id}`} className="text-blue-600 hover:text-blue-900">查看详情</Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 分页控件 */}
      <div className="px-6 py-4 border-t flex items-center justify-between">
        <div className="flex-1 flex justify-between sm:hidden">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            disabled={currentPage === 1}
          >
            上一页
          </button>
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            disabled={currentPage === totalPages}
          >
            下一页
          </button>
        </div>
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              显示第 <span className="font-medium">{(currentPage - 1) * 10 + 1}</span> 到 
              <span className="font-medium">{Math.min(currentPage * 10, totalCount)}</span> 条，
              共 <span className="font-medium">{totalCount}</span> 条
            </p>
          </div>
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                disabled={currentPage === 1}
              >
                <span className="sr-only">上一页</span>
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              
              {/* 页码（限制显示最多5个页码） */}
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum = currentPage <= 3 ? i + 1 : 
                              currentPage >= totalPages - 2 ? totalPages - 4 + i : 
                              currentPage - 2 + i;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium ${
                      pageNum === currentPage ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                disabled={currentPage === totalPages}
              >
                <span className="sr-only">下一页</span>
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsTable;