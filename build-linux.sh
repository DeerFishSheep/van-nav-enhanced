#!/bin/bash
set -e

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 开始构建 Van Nav for Linux x86_64...${NC}"
echo ""

# 检查必要的命令
if ! command -v pnpm &> /dev/null; then
    echo -e "${YELLOW}⚠️  pnpm 未安装，正在尝试使用 npm 安装...${NC}"
    npm install -g pnpm
fi

if ! command -v go &> /dev/null; then
    echo -e "${YELLOW}❌ Go 未安装，请先安装 Go 1.19+${NC}"
    exit 1
fi

echo -e "${GREEN}📦 步骤 1/6: 安装前端依赖...${NC}"
cd ui
pnpm install

echo ""
echo -e "${GREEN}🔨 步骤 2/6: 构建前端...${NC}"
pnpm run build

echo ""
echo -e "${GREEN}📋 步骤 3/6: 准备嵌入资源...${NC}"
cd ..
echo "   清空 public 目录..."
rm -rf public/*
echo "   复制前端构建产物..."
cp -r ui/build/* public/

echo ""
echo -e "${GREEN}🔧 步骤 4/6: 构建 Linux x86_64 二进制文件...${NC}"
echo "   目标: Linux amd64"
echo "   优化: 去除调试信息，减小文件大小"
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="-s -w" -o van-nav-linux-amd64 .

echo ""
echo -e "${GREEN}📦 步骤 5/6: 创建发布包...${NC}"
RELEASE_DIR="van-nav-linux-amd64-release"
rm -rf "$RELEASE_DIR"
mkdir -p "$RELEASE_DIR"

echo "   复制二进制文件..."
mv van-nav-linux-amd64 "$RELEASE_DIR/van-nav"

echo "   复制一键部署脚本..."
cp van-nav-service.sh "$RELEASE_DIR/"
chmod +x "$RELEASE_DIR/van-nav-service.sh"

echo "   创建 README..."
cat > "$RELEASE_DIR/README.txt" << 'EOF'
========================================
Van-Nav Linux x86_64 发布包
========================================

【包含文件】
- van-nav              : 主程序（可执行文件）
- van-nav-service.sh   : 一键部署脚本（自动配置systemd服务）
- README.txt           : 本说明文件

【快速部署（推荐）】
1. 上传整个文件夹到服务器：
   scp -r van-nav-linux-amd64-release user@your-server:/opt/van-nav

2. SSH到服务器并运行一键部署：
   cd /opt/van-nav
   chmod +x van-nav-service.sh
   ./van-nav-service.sh

3. 访问服务：
   http://your-server-ip:6412
   默认账号: admin / admin

【自定义端口】
编辑 van-nav-service.sh 文件，修改第8行：
PORT="6412"  # 改为您想要的端口

【手动部署】
1. 给二进制文件添加执行权限：
   chmod +x van-nav

2. 直接运行（默认端口6412）：
   ./van-nav

3. 指定端口运行：
   ./van-nav -port 8080

【重要提示】
- 首次登录后请立即修改默认密码
- 数据库文件会自动创建在 data/nav.db
- 使用一键脚本会自动配置开机自启

【故障排查】
- 权限错误: chmod +x van-nav
- 端口被占用: 修改端口或关闭占用进程
- 服务状态: sudo systemctl status van-nav

【更多帮助】
项目地址: https://github.com/mereithhh/van-nav
========================================
EOF

echo ""
echo -e "${GREEN}🗜️  步骤 6/6: 压缩发布包...${NC}"
tar -czf "${RELEASE_DIR}.tar.gz" "$RELEASE_DIR"

echo ""
echo -e "${BLUE}✅ 构建完成！${NC}"
echo ""
echo "📦 发布包信息："
echo "   目录: $RELEASE_DIR/"
echo "   压缩包: ${RELEASE_DIR}.tar.gz"
ls -lh "${RELEASE_DIR}.tar.gz"
echo ""
echo "📋 包含文件："
ls -lh "$RELEASE_DIR/"

echo ""
echo -e "${GREEN}🎉 构建成功！${NC}"
echo ""
echo "📋 部署方式："
echo ""
echo "【方式1：上传压缩包（推荐）】"
echo "   scp ${RELEASE_DIR}.tar.gz user@your-server:/tmp/"
echo "   ssh user@your-server"
echo "   cd /tmp && tar -xzf ${RELEASE_DIR}.tar.gz"
echo "   cd $RELEASE_DIR && sudo ./van-nav-service.sh"
echo ""
echo "【方式2：上传整个目录】"
echo "   scp -r $RELEASE_DIR user@your-server:/opt/van-nav"
echo "   ssh user@your-server"
echo "   cd /opt/van-nav && sudo ./van-nav-service.sh"
echo ""
echo "📖 详细说明请查看: $RELEASE_DIR/README.txt"

