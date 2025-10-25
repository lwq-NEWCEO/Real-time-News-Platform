# Real-time-News-Platform
This project is to create a front-end screening web page and a large model based on a knowledge base, aiming to provide a dual-selection platform for college students and teachers in the scientific research field. Currently, the complete front-end code and large model code are available.

## ECNU web编程大作业（90+）跟大家分享一下，如果觉得还不错可以点个star哦~

在信息爆炸的时代，新闻媒体每天产生海量的内容，用户往往难以快速把握舆论动态和热点话题的演变趋势。基于此，我萌生了一个想法：开发一个实时新闻爬取和统计分析平台，利用现代化的Web技术实现前后端交互，帮助用户更高效地理解新闻背后的故事。我选择以React和JavaScript为核心框架，希望通过这个项目，既能解决实际问题，又能深入实践全栈开发的完整流程。

## 本项目采用前后端分离的架构设计，确保开发的高效性与模块化：
```
前端：以React.js为框架，结合Ant Design组件库，打造专业、直观且响应式的用户界面，提供流畅的交互体验
后端：基于Node.js和Express.js构建RESTful API，作为数据处理和前端请求的核心中枢。
数据库：使用PostgreSQL存储新闻数据、关键词趋势和情感统计结果，保证数据的持久化与高效查询。
```
这种架构不仅清晰地划分了职责，还为后续功能的扩展提供了灵活性。

## 使用工具与技术

为了实现从数据采集到可视化的完整闭环，我选用了以下工具和技术：
```
数据采集：采用Puppeteer实现自动化网络爬虫，定时抓取主流新闻媒体的最新头条新闻,我获取了https://newsapi.org/ 的API，抓取实时新闻动态。
数据处理：借助natural.js库进行自然语言处理，提取关键词并进行情感分析，挖掘数据的深层价值。
数据可视化：集成ECharts绘制趋势折线图和情感分布饼图，使用react-d3-cloud（基于D3.js）生成动态词云，直观呈现分析结果。
任务调度：通过node-schedule管理定时任务，确保数据实时更新。
部署支持：项目支持本地运行，同时兼容Docker容器化部署，便于开发与生产环境的切换，我采用的是Docker。
```
## 最终效果

经过开发与优化，该平台最终实现了一个功能强大且用户友好的新闻分析工具。用户可以通过直观的界面：
```
1.实时浏览：查看不断更新的新闻列表，掌握最新动态。
2.多维洞察：通过交互式图表探索数据：
3.动态词云突出显示当前热点词汇，字体大小与颜色随词频变化。
4.情感分布饼图以清晰的色块揭示舆论的正负面倾向。
5.关键词趋势折线图量化特定话题的热度变化趋势。
6.个性化交互：支持关键词筛选、时间范围调整和暗黑模式切换，用户可根据需求灵活探索数据。
```
## 最终，这个项目不仅达成了“前后端交互”的技术目标，还成功将复杂的新闻数据转化为直观的可视化结果，为用户提供了一个高效洞察舆论动态的窗口，同时也为我积累了宝贵的全栈开发经验。

## 实时新闻数据分析与可视化：

指令：
```
cd C:\Users\10235\LWQ\10235501417_罗文琦_项目代码\news-analysis-platform_前后端交互项目
npm run start
```
即可启动后端运行

<img width="800" height="400" alt="image" src="https://github.com/user-attachments/assets/f6ff7477-38d5-48f2-b570-78194c02d4a4" />

启动后端之后，启动前端：
```
cd C:\Users\10235\LWQ\10235501417_罗文琦_项目代码\news-analysis-platform_前后端交互项目
cd frontend
npm start
```
即可启动前端...

<img width="800" height="400" alt="image" src="https://github.com/user-attachments/assets/6760728c-8f1d-42dc-8967-13ed49b8f4e5" />

我的界面设置分为深色系和浅色系（深色系晚上看护眼，浅色系白天看清晰）


<img width="800" height="400" alt="image" src="https://github.com/user-attachments/assets/9e249299-4984-4129-bcc8-c511f1e5bee0" />

<img width="800" height="400" alt="image" src="https://github.com/user-attachments/assets/79ec8709-d3b0-4fea-b7d4-9d01eb29bafc" />

<img width="800" height="400" alt="image" src="https://github.com/user-attachments/assets/703a645c-b661-4164-b17d-eed1b76d052f" />

<img width="800" height="400" alt="image" src="https://github.com/user-attachments/assets/5075662e-9204-402b-8a99-eec3bd26cf70" />

<img width="800" height="600" alt="image" src="https://github.com/user-attachments/assets/772d9f87-7026-465c-a5bf-e5fc8ca8a841" />



并且词云图中的单词是可以点击并同步切换关键词的！！这个要留到我的视频中进行讲解啦
<img width="800" height="380" alt="image" src="https://github.com/user-attachments/assets/f0758fc0-b8df-4e92-adf5-1f685e8bdb5c" />

点击可以直接链接到相关网页,
比如我点击第一个可以直接跳转到BBC的网页
<img width="800" height="280" alt="image" src="https://github.com/user-attachments/assets/bae23eda-ab1e-43f8-bd5e-d7145a20e455" />







