# GitHub Pages 配置指南

## 📝 发布 API 文档到 GitHub Pages

### 1️⃣ 上传项目到 GitHub

```bash
# 在项目目录下
git init
git add .
git commit -m "Initial commit - Enhanced van-nav"
git branch -M main
git remote add origin https://github.com/your-username/your-repo-name.git
git push -u origin main
```

### 2️⃣ 配置 GitHub Pages

1. 打开您的 GitHub 仓库页面
2. 点击 **Settings** (设置)
3. 在左侧菜单中找到 **Pages**
4. 在 **Source** 下拉菜单中选择：
   - **Branch**: `main`
   - **Folder**: `/api-website`
5. 点击 **Save** (保存)

### 3️⃣ 等待部署

GitHub 会自动开始构建和部署，大约需要 1-3 分钟。

部署完成后，您会看到一个绿色提示框：
```
Your site is live at https://your-username.github.io/your-repo-name/
```

### 4️⃣ 更新 README 中的链接

编辑 `README.md`，将以下内容中的占位符替换为您的实际地址：

**查找**：
```markdown
> **增强版 API 文档**：[https://your-username.github.io/van-nav/](https://your-username.github.io/van-nav/)  
> （部署后请替换为您的实际 GitHub Pages 地址）
```

**替换为**：
```markdown
> **增强版 API 文档**：[https://your-username.github.io/your-repo-name/](https://your-username.github.io/your-repo-name/)
```

### 5️⃣ 提交更改

```bash
git add README.md
git commit -m "Update API documentation link"
git push
```

---

## 🎯 API 文档说明

API 文档使用 **Redoc** 渲染，特点：
- ✅ 响应式设计，支持移动端
- ✅ 自动生成交互式文档
- ✅ 支持搜索和导航
- ✅ 美观的三栏布局

文档源文件：
- **HTML 界面**: `api-website/index.html`
- **API 规范**: `api-website/openapi.yaml`

---

## 🔧 本地预览 API 文档

### 方法 1：使用 Python HTTP 服务器

```bash
cd api-website
python3 -m http.server 8000
```

然后打开浏览器访问：`http://localhost:8000`

### 方法 2：使用 Node.js serve

```bash
npm install -g serve
cd api-website
serve
```

### 方法 3：直接用浏览器打开

由于使用了相对路径，您也可以直接用浏览器打开 `api-website/index.html` 文件。

---

## 📚 更新 API 文档

当您修改了 API 接口后，需要更新 `api-website/openapi.yaml` 文件。

修改完成后：
```bash
git add api-website/openapi.yaml
git commit -m "Update API documentation"
git push
```

GitHub Pages 会自动重新部署（1-3分钟）。

---

## ❓ 常见问题

### Q: 页面显示 404
**A**: 请确认：
1. 已正确配置 Pages（选择 `main` 分支和 `/api-website` 目录）
2. 已等待部署完成（1-3分钟）
3. 访问的 URL 正确

### Q: 样式或内容不更新
**A**: 清除浏览器缓存或使用隐私模式访问

### Q: 想使用自定义域名
**A**: 在 GitHub Pages 设置中，找到 **Custom domain** 输入您的域名，并按照提示配置 DNS

---

## 🎉 完成！

现在您的 API 文档已经公开发布了！

**访问地址**：`https://your-username.github.io/your-repo-name/`

可以将此链接分享给其他开发者使用。

