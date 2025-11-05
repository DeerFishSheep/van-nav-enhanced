# 📤 上传项目到 GitHub 完整指南

## 🎯 方法一：全新项目推送（推荐）

### 1️⃣ 在 GitHub 创建新仓库

1. 访问 https://github.com/new
2. 填写仓库信息：
   - **Repository name**: `van-nav-enhanced`（或您喜欢的名称）
   - **Description**: `Enhanced van-nav with subcategory system`
   - **Public** 或 **Private**（公开或私有）
   - ⚠️ **不要勾选任何初始化选项**（README、.gitignore、License）
3. 点击 **Create repository**

### 2️⃣ 在本地项目目录执行命令

复制以下命令，**按顺序执行**：

```bash
# 1. 进入项目目录
cd /Users/lyy/Documents/Cursor/van-nav-master

# 2. 初始化 Git 仓库
git init

# 3. 添加所有文件到暂存区
git add .

# 4. 提交到本地仓库
git commit -m "Initial commit: Enhanced van-nav with subcategory system"

# 5. 设置默认分支为 main
git branch -M main

# 6. 关联远程仓库（替换为您的仓库地址）
git remote add origin https://github.com/your-username/van-nav-enhanced.git

# 7. 推送到 GitHub
git push -u origin main
```

⚠️ **重要**：将第 6 步中的 `your-username` 和 `van-nav-enhanced` 替换为您的实际 GitHub 用户名和仓库名。

### 3️⃣ 输入 GitHub 凭证

首次推送时会要求输入凭证：

**选项 A - 使用 Personal Access Token（推荐）**：
1. 访问 https://github.com/settings/tokens
2. 点击 **Generate new token** → **Generate new token (classic)**
3. 勾选权限：`repo`（完整的仓库控制权限）
4. 生成并复制 token
5. 在终端输入：
   - **Username**: 您的 GitHub 用户名
   - **Password**: 粘贴刚才的 token（**不是您的密码**）

**选项 B - 使用 SSH**：
如果已配置 SSH 密钥，使用 SSH URL：
```bash
git remote set-url origin git@github.com:your-username/van-nav-enhanced.git
git push -u origin main
```

---

## 🎯 方法二：已有本地 Git 仓库

如果项目目录已经是 Git 仓库（有 `.git` 文件夹）：

```bash
# 1. 进入项目目录
cd /Users/lyy/Documents/Cursor/van-nav-master

# 2. 查看当前状态
git status

# 3. 添加所有更改
git add .

# 4. 提交更改
git commit -m "Enhanced van-nav with subcategory system"

# 5. 添加远程仓库（如果还没有）
git remote add origin https://github.com/your-username/van-nav-enhanced.git

# 6. 推送到 GitHub
git push -u origin main
```

---

## 🔧 常见问题解决

### ❌ 错误 1：`fatal: not a git repository`

**原因**：当前目录不是 Git 仓库

**解决**：
```bash
git init
```

### ❌ 错误 2：`remote origin already exists`

**原因**：已经添加过远程仓库

**解决**：
```bash
# 查看现有远程仓库
git remote -v

# 删除旧的
git remote remove origin

# 添加新的
git remote add origin https://github.com/your-username/van-nav-enhanced.git
```

### ❌ 错误 3：`failed to push some refs`

**原因**：远程仓库有本地没有的内容（如 README）

**解决方案 A - 强制推送（会覆盖远程）**：
```bash
git push -u origin main --force
```

**解决方案 B - 先拉取再推送**：
```bash
git pull origin main --allow-unrelated-histories
git push -u origin main
```

### ❌ 错误 4：`Support for password authentication was removed`

**原因**：GitHub 不再支持密码认证

**解决**：使用 Personal Access Token 代替密码（见上面"输入 GitHub 凭证"部分）

### ❌ 错误 5：文件太大无法推送

**原因**：单个文件超过 100MB

**解决**：
```bash
# 查找大文件
find . -type f -size +50M

# 如果是二进制文件（如编译后的可执行文件），添加到 .gitignore
echo "nav" >> .gitignore
echo "van-nav-linux-amd64" >> .gitignore
echo "*.tar.gz" >> .gitignore

# 重新提交
git add .gitignore
git commit -m "Add large files to .gitignore"
git push
```

### ❌ 错误 6：node_modules 太大导致推送慢

**解决**：确保 `.gitignore` 包含：
```bash
# 查看是否已忽略
cat .gitignore | grep node_modules

# 如果没有，添加
echo "node_modules/" >> .gitignore
echo "ui/node_modules/" >> .gitignore

# 如果已经提交了，从 Git 中删除（但保留本地文件）
git rm -r --cached ui/node_modules
git commit -m "Remove node_modules from Git"
```

---

## 📋 推送前检查清单

在执行 `git push` 之前，建议检查：

```bash
# 1. 查看当前状态
git status

# 2. 查看将要提交的文件
git ls-files

# 3. 查看文件大小统计
du -sh .git

# 4. 查看是否有大文件
find . -type f -size +10M | grep -v node_modules | grep -v .git

# 5. 确认 .gitignore 正确
cat .gitignore
```

**建议忽略的文件**：
- ✅ `node_modules/`
- ✅ `*.log`
- ✅ `.DS_Store`
- ✅ `data/nav.db`（用户数据）
- ✅ 编译后的二进制文件
- ✅ `*.tar.gz`（发布包）

---

## 🎯 完整的 .gitignore 示例

创建或更新 `.gitignore` 文件：

```gitignore
# 依赖
node_modules/
ui/node_modules/

# 构建产物
*.exe
*.dll
*.so
*.dylib
nav
van-nav
van-nav-*
!van-nav-service.sh

# 发布包
*.tar.gz
*.zip
*-release/

# 用户数据
data/
*.db

# 日志
*.log
logs/

# 操作系统
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo

# 临时文件
*.tmp
*.bak
*~
</gitignore>

---

## 🚀 推送成功后的操作

### 1️⃣ 配置 GitHub Pages（API 文档）

1. 进入仓库 **Settings** → **Pages**
2. Source 选择：
   - Branch: `main`
   - Folder: `/api-website`
3. 点击 **Save**
4. 等待 1-3 分钟，获取 Pages URL

### 2️⃣ 创建 Release（可选）

1. 进入仓库 **Releases** → **Create a new release**
2. 填写：
   - **Tag**: `v1.0.0-enhanced`
   - **Title**: `v1.0.0 Enhanced Edition`
   - **Description**: 列出新增功能
3. 上传发布包：
   - `van-nav-linux-amd64-release.tar.gz`
4. 点击 **Publish release**

### 3️⃣ 更新 README 中的链接

将 README.md 中的占位符替换为实际链接：
- GitHub Pages URL
- Release 下载链接

```bash
# 编辑 README.md
# 然后提交更新
git add README.md
git commit -m "Update links in README"
git push
```

---

## 💡 后续维护

### 提交新更改

```bash
# 1. 查看更改
git status

# 2. 添加更改
git add .

# 3. 提交
git commit -m "描述您的更改"

# 4. 推送
git push
```

### 创建新分支开发

```bash
# 创建并切换到新分支
git checkout -b feature/new-feature

# 开发完成后推送
git push -u origin feature/new-feature

# 在 GitHub 创建 Pull Request
```

---

## 🎉 完成！

项目成功上传到 GitHub 后，您可以：
- ✅ 在线查看代码
- ✅ 与他人分享
- ✅ 接收 Issues 和 Pull Requests
- ✅ 使用 GitHub Actions 自动构建
- ✅ 发布 API 文档到 GitHub Pages

**仓库地址**：`https://github.com/your-username/van-nav-enhanced`

---

## 📞 需要帮助？

如果遇到其他问题：
1. 查看错误信息
2. 使用 `git status` 检查状态
3. 使用 `git log` 查看提交历史
4. 参考 [GitHub 官方文档](https://docs.github.com/cn)

