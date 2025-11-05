# Van Nav - Enhanced Edition

> **原作者**: [Mereithhh](https://github.com/Mereithhh)  
> **原项目**: [van-nav](https://github.com/Mereithhh/van-nav)  
> **基于版本**: v1.12.1  
> **本版本**: 增强版，在原版基础上新增子分类系统、智能排序等功能

一个轻量的导航站，现在有搜索引擎集成了，很适合作为主页使用。有配套的[浏览器插件](https://github.com/Mereithhh/van-nav-extension)和 API。

## ✨ 增强版新增功能

相比原版 v1.12.1，本版本新增以下功能：

### 🎯 核心功能增强

- **✅ 子分类系统**
  - 支持在大分类下创建子分类
  - 子分类独立排序（仅在所属大分类下计算序号）
  - 导航页面子分类标签展示，可折叠/展开
  - 后台管理支持子分类的增删改查

- **✅ 智能排序系统**
  - 基于 `COUNT(*)` 的智能序号验证（不依赖历史数据）
  - 排序值最小为 1，最大自动限制
  - 添加、修改、删除时自动调整其他项排序
  - 保持序号连贯性和唯一性

- **✅ 删除保护机制**
  - 大分类删除前检查是否有书签
  - 子分类删除前检查是否有书签
  - 防止误删除导致数据丢失

### 🎨 用户体验优化

- **✅ 管理后台优化**
  - 新增圆形"管理"入口按钮（右下角）
  - 统一所有按钮大小和样式
  - 书签列表显示子分类列
  - 支持按子分类筛选书签
  - 排序切换（正序/倒序）

- **✅ 添加/编辑优化**
  - 新增大分类/子分类后自动选中
  - 子分类动态显示（根据选择的大分类）
  - 序号输入自动限制范围
  - 友好的错误提示

### 🚀 部署优化

- **✅ 一键部署脚本**
  - 自动配置 systemd 服务
  - 自动设置开机自启
  - 端口可配置（脚本开头变量）
  - 生成服务管理卡片

- **✅ 完整发布包**
  - 包含可执行文件
  - 包含一键部署脚本
  - 包含 README 说明
  - 压缩包和目录两种形式

### 📚 API 增强

- **✅ 字符串化子分类**
  - API 使用 `subCatelog`（字符串）
  - 同时返回 `subCatelogId`（数字）用于兼容
  - 自动创建不存在的分类/子分类
  - 空子分类自动分配到"默认"

- **✅ 完善的 API 文档**
  - 更新 OpenAPI 3.1 规范
  - 包含所有新增接口
  - 详细的参数说明和示例

## 预览

### PC

<img src="images/pc_preview.png" alt="PC" style="width: 100%;"/>

### PAD

<img src="images/pad_preview.png" alt="PAD" style="width: 100%;"/>

### PHONE

<img src="images/phone_preview.png" alt="PHONE" style="width: 100%;"/>

### 后台设置

<img src="images/login.jpg" alt="登录" style="width: 100%;"/>

<img src="images/admin.jpg" alt="后台设置" style="width: 100%;"/>

## 使用技巧/快捷键

其实这个导航站有很多小设计，合理使用可以提高使用效率：

- 只要在这个页面里，直接输入键盘任何按键，可以直接聚焦到搜索框开始输入。
- 搜索完按回车会直接在新标签页打开第一个结果。
- 搜索完按一下对应卡片右上角的数字按钮 + Ctrl(mac 也可以用 command 键) ，也会直接打开对应结果。

另外可以设置跳转方式哦。

## 安装方法

### 🎯 一键部署（推荐 - 新增）

**适用于 Debian/Ubuntu Linux x86_64**

1. **下载发布包**
   ```bash
   wget https://github.com/DeerFishSheep/van-nav-enhanced/releases/latest/download/van-nav-linux-amd64-release.tar.gz
   ```

2. **解压**
   ```bash
   tar -xzf van-nav-linux-amd64-release.tar.gz
   cd van-nav-linux-amd64-release
   ```

3. **运行一键部署脚本**
   ```bash
   sudo ./van-nav-service.sh
   ```

脚本会自动：
- ✅ 配置 systemd 服务
- ✅ 设置开机自启
- ✅ 启动服务
- ✅ 生成管理命令卡片

**自定义端口**：编辑 `van-nav-service.sh` 文件第 8 行：
```bash
PORT="6412"  # 改为您想要的端口
```

**服务管理命令**：
```bash
sudo systemctl start van-nav    # 启动
sudo systemctl stop van-nav     # 停止
sudo systemctl restart van-nav  # 重启
sudo systemctl status van-nav   # 状态
sudo journalctl -u van-nav -f   # 日志
```

### Docker

```bash
docker run -d --name tools --restart always -p 6412:6412 -v /path/to/your/data:/app/data mereith/van-nav:latest
```

> 注意：Docker 镜像为原作者发布的版本，不包含本增强版功能。如需使用增强版，请使用可执行文件或自行构建。

打开浏览器 [http://localhost:6412](http://localhost:6412) 即可访问。

- 默认端口 6412
- 默认账号密码 admin admin 第一次运行后请进入后台修改
- 数据库会自动创建在 `data/nav.db`

### 可执行文件（手动部署）

下载 release 文件夹里面对应平台的二进制文件，直接运行即可。

打开浏览器 [http://localhost:6412](http://localhost:6412) 即可访问。

```bash
# 添加执行权限
chmod +x van-nav

# 运行（默认端口 6412）
./van-nav

# 指定端口运行
./van-nav -port 8080
```

- 默认端口 6412，运行时添加 `-port <port>` 参数可指定运行端口
- 默认账号密码 admin admin，第一次运行后请进入后台修改
- 数据库会自动创建在运行目录的 `data/nav.db`

### 从源码构建

**前提条件**：
- Go 1.19+
- Node.js 16+
- pnpm

**构建步骤**：
```bash
# 克隆仓库
git clone https://github.com/DeerFishSheep/van-nav-enhanced.git
cd van-nav-enhanced

# 运行构建脚本
chmod +x build-linux.sh
./build-linux.sh
```

构建完成后会在 `van-nav-linux-amd64-release/` 目录生成完整的发布包。

### nginx 反向代理

参考配置

> 其中 `<yourhost>` 和 `<your-cert-path>` 替换成你自己的。

```nginx
server {
    listen 80;
    server_name <yourhost>;
    return 301 https://$host$request_uri;
}

server {
    listen 443   ssl http2;
    server_name <yourhost>;

    ssl_certificate <your-cert-path>
    ssl_certificate_key <your-key-path>;
    ssl_verify_client off;
    proxy_ssl_verify off;
    location / {
        proxy_pass  http://127.0.0.1:6412;
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
        proxy_set_header Upgrade $http_upgrade;
    }
}
```

## 浏览器插件

具体请看： [浏览器插件仓库](https://github.com/Mereithhh/van-nav-extension)

具有一键增加工具，快速打开管理后台和主站等功能。具体自行探索哦。

> 注意：插件为原作者开发，可能不完全兼容本增强版的新功能（如子分类）。

## API 文档

本导航站支持 API，可以用自己的方法添加工具。

> **增强版 API 文档**：[https://deerfishsheep.github.io/van-nav-enhanced/](https://deerfishsheep.github.io/van-nav-enhanced/)

### API 新增功能

- ✅ 使用字符串指定子分类（`subCatelog`）
- ✅ 自动创建不存在的大分类和子分类
- ✅ 空子分类自动分配到"默认"
- ✅ 子分类管理接口（CRUD）
- ✅ 智能排序验证

### 快速示例

**添加书签**：
```bash
curl -X POST http://localhost:6412/api/admin/tool \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "GitHub",
    "url": "https://github.com",
    "catelog": "开发工具",
    "subCatelog": "代码托管",
    "desc": "代码托管平台"
  }'
```

系统会自动：
1. 创建"开发工具"大分类（如果不存在）
2. 在"开发工具"下创建"代码托管"子分类（如果不存在）
3. 添加书签到对应位置

## FAQ

- 忘记密码了怎么办： [看这里](https://github.com/Mereithhh/van-nav/issues/36)
- 如何备份数据：备份 `data/nav.db` 文件即可
- 如何迁移数据：复制 `data/nav.db` 到新环境
- 端口被占用：修改启动参数 `-port 其他端口`

## 参与开发

欢迎参与开发！

如果你有 golang 和 react 开发经验，可以很轻松上手。

**开发环境搭建**：
```bash
# 后端开发
go run .

# 前端开发（另一个终端）
cd ui
pnpm install
pnpm start
```

提交 PR 前请确保代码通过测试。

## 技术栈

- **后端**: Go + Gin
- **前端**: React + TypeScript + Ant Design
- **数据库**: SQLite
- **构建**: Go embed + pnpm

## 功能状态

原版功能：
- [x] 多平台构建流水线
- [x] 定制化 logo 和标题
- [x] 导入导出功能
- [x] 暗色主题切换
- [x] 移动端优化
- [x] 自动获取网站 logo
- [x] 拼音匹配的模糊搜索功能
- [x] 按键直接搜索，搜索后回车直接打开第一项
- [x] 图片存库，避免跨域和加载慢的问题
- [x] gzip 全局压缩
- [x] 中文 url 图片修复
- [x] svg 图片修复
- [x] 浏览器插件
- [x] 自动获取网站题目和描述等信息
- [x] 后台按钮可自定义隐藏
- [x] github 按钮可隐藏
- [x] 支持登录后才能查看的隐藏卡片
- [x] 搜索引擎集成功能
- [x] 增加一些搜索后快捷键直接打开卡片
- [x] 支持自定义跳转方式
- [x] 自动主题切换
- [x] 增加 ServiceWork ,离线可用,可安装
- [x] 支持后台设置默认跳转方式
- [x] 支持指定监听端口

增强版新增：
- [x] 子分类系统
- [x] 智能排序系统
- [x] 删除保护机制
- [x] 一键部署脚本
- [x] 管理后台优化
- [x] API 字符串化子分类
- [x] 完善的 API 文档

计划中：
- [ ] 国际化
- [ ] 网站状态检测
- [ ] 子分类拖拽排序
- [ ] 批量操作功能

## 更新日志

详见 [CHANGELOG.md](CHANGELOG.md) 和 [原项目 CHANGELOG](https://github.com/Mereithhh/van-nav/blob/master/CHANGELOG.md)

## 致谢

感谢 [Mereithhh](https://github.com/Mereithhh) 开发了这么优秀的开源项目！

本增强版在原版 v1.12.1 基础上进行了功能扩展和优化，保留了原版的所有优秀特性。

## License

MIT License

---

**相关链接**：
- 原项目：[van-nav by Mereithhh](https://github.com/Mereithhh/van-nav)
- 浏览器插件：[van-nav-extension](https://github.com/Mereithhh/van-nav-extension)
- 原作者在线演示：[demo-tools.mereith.com](https://demo-tools.mereith.com)
