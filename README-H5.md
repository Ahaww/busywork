# 心灵伙伴 - H5 + PWA 版本

心理健康助手，支持情绪倾诉、呼吸放松、心理科普、心情日记等功能。

## 快速开始

### 安装依赖
```bash
npm install
```

### 开发模式
```bash
npm run dev
```
访问 http://localhost:5173

### 构建生产版本
```bash
npm run build
```

### 预览生产版本
```bash
npm run preview
```

## 部署到手机

### 方法一：本地网络访问
1. 确保手机和电脑在同一WiFi网络
2. 运行 `npm run dev`
3. 在手机浏览器访问显示的 Network 地址（如 http://192.168.x.x:5173）
4. 添加到主屏幕（iOS：分享按钮 -> 添加到主屏幕；Android：菜单 -> 添加到主屏幕）

### 方法二：部署到服务器
1. 运行 `npm run build`
2. 将 `dist` 目录上传到任意静态网站托管服务：
   - Vercel: `vercel deploy dist`
   - Netlify: 拖拽 `dist` 文件夹到 Netlify
   - GitHub Pages: 推送到仓库并开启 Pages
3. 访问部署后的URL，添加到主屏幕

### 方法三：使用 ngrok（无需服务器）
1. 下载并安装 ngrok
2. 运行 `npm run dev`
3. 在新终端运行：`ngrok http 5173`
4. 复制 ngrok 提供的 https 地址
5. 在手机浏览器访问该地址

## PWA 功能

- 离线可用（首次加载后）
- 可安装到手机主屏幕
- 全屏显示，类似原生App体验
- 支持iOS和Android

## 项目结构

```
temp/
├── index.html          # HTML入口
├── vite.config.js      # Vite配置
├── package.json        # 项目配置
├── src/
│   ├── main.js         # 应用入口
│   ├── wx-polyfill.js  # 微信API兼容层
│   ├── render.js       # Canvas渲染配置
│   └── js/
│       ├── main.js     # 主逻辑
│       ├── runtime/    # 各功能模块
│       ├── services/   # 服务层
│       └── libs/       # 工具库
└── public/
    ├── manifest.json   # PWA清单
    └── icon-*.svg      # 应用图标
```

## 技术栈

- **Vite**: 快速的构建工具
- **Canvas 2D**: 图形渲染
- **PWA**: 渐进式Web应用
- **LocalStorage**: 数据持久化

## 功能模块

- 情绪倾诉：与AI聊天，倾诉心情
- 呼吸放松：引导式呼吸练习
- 心理科普：心理健康知识
- 心情日记：记录每日心情
- 情绪评估：评估当前情绪状态
