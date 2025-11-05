#!/bin/bash
# setup-van-nav-service.sh - 通用服务设置脚本

set -e

# ==================== 配置参数 ====================
SERVICE_NAME="van-nav"
PORT="6412"                    # 默认端口，可修改
CARD_FILE="van-nav-service-management.txt"
# ================================================

# 检查root权限
if [ "$EUID" -ne 0 ]; then
    echo "请使用sudo运行此脚本: sudo $0"
    exit 1
fi

# 自动查找van-nav可执行文件
find_van_nav() {
    # 在当前目录查找
    if [ -f "./van-nav" ]; then
        echo "$(pwd)/van-nav"
        return 0
    fi
    
    # 在常见目录查找
    local common_dirs=("/opt/van-nav" "/usr/local/bin" "/home/*/van-nav" "/root/van-nav")
    for dir in "${common_dirs[@]}"; do
        for path in $dir/van-nav; do
            if [ -f "$path" ]; then
                echo "$path"
                return 0
            fi
        done
    done
    
    # 使用find命令全局查找
    local found_path=$(find / -name "van-nav" -type f -executable 2>/dev/null | head -1)
    if [ -n "$found_path" ]; then
        echo "$found_path"
        return 0
    fi
    
    return 1
}

# 创建服务管理卡片
create_service_card() {
    local install_dir="$1"
    local van_nav_path="$2"
    local current_dir=$(pwd)
    local card_path="$current_dir/$CARD_FILE"
    local server_ip=$(hostname -I | awk '{print $1}')
    
    cat > "$card_path" << EOF
========================================
Van-Nav 服务管理卡片
创建时间: $(date)
========================================

【基本信息】
服务名称: $SERVICE_NAME
可执行文件: $van_nav_path
工作目录: $install_dir
服务文件: /etc/systemd/system/$SERVICE_NAME.service
访问地址: http://$server_ip:$PORT
默认账号: admin / admin
监听端口: $PORT

【服务管理命令】
启动服务:    sudo systemctl start $SERVICE_NAME
停止服务:    sudo systemctl stop $SERVICE_NAME
重启服务:    sudo systemctl restart $SERVICE_NAME
查看状态:    sudo systemctl status $SERVICE_NAME
查看日志:    sudo journalctl -u $SERVICE_NAME -f
启用自启:    sudo systemctl enable $SERVICE_NAME
禁用自启:    sudo systemctl disable $SERVICE_NAME

【日志查看命令】
实时日志:    sudo journalctl -u $SERVICE_NAME -f
最近日志:    sudo journalctl -u $SERVICE_NAME -n 50
全部日志:    sudo journalctl -u $SERVICE_NAME --no-pager

【文件位置】
配置文件:    $install_dir/data/nav.db (自动生成)
服务配置:    /etc/systemd/system/$SERVICE_NAME.service
应用程序:    $van_nav_path

【故障排查】
1. 检查服务状态: systemctl status $SERVICE_NAME
2. 检查端口占用: netstat -tlnp | grep $PORT
3. 检查防火墙: ufw status 或 iptables -L
4. 查看详细日志: journalctl -u $SERVICE_NAME

【重要提示】
1. 首次登录后请立即修改默认密码
2. 数据库文件会自动创建在工作目录
3. 服务异常时可查看日志进行排查
4. 定期备份 $install_dir/nav.db 文件

========================================
EOF

    echo "服务管理卡片已创建: $card_path"
    chmod 644 "$card_path"
}

# 显示服务卡片内容
show_service_card() {
    local current_dir=$(pwd)
    local card_path="$current_dir/$CARD_FILE"
    
    if [ -f "$card_path" ]; then
        echo ""
        echo "=== 服务管理卡片内容 ==="
        cat "$card_path"
    fi
}

# 主函数
main() {
    echo "=== Van-Nav 服务设置脚本 ==="
    
    # 查找van-nav文件
    echo "查找van-nav可执行文件..."
    VAN_NAV_PATH=$(find_van_nav)
    
    if [ -z "$VAN_NAV_PATH" ]; then
        echo "错误: 未找到van-nav可执行文件"
        echo "请将脚本放在van-nav文件所在目录运行，或手动指定路径"
        echo "用法: $0 /path/to/van-nav"
        exit 1
    fi
    
    INSTALL_DIR=$(dirname "$VAN_NAV_PATH")
    echo "找到van-nav: $VAN_NAV_PATH"
    echo "安装目录: $INSTALL_DIR"
    
    # 设置执行权限
    chmod +x "$VAN_NAV_PATH"
    
    # 创建服务文件
    local service_file="/etc/systemd/system/${SERVICE_NAME}.service"
    
    cat > "$service_file" << EOF
[Unit]
Description=VanNav - Navigation Service
Documentation=https://github.com/mereithhh/van-nav
After=network.target
Wants=network.target

[Service]
Type=simple
WorkingDirectory=$INSTALL_DIR
ExecStart=$VAN_NAV_PATH -port $PORT
Restart=on-failure
RestartSec=5s
User=root
Group=root

[Install]
WantedBy=multi-user.target
EOF

    # 启用服务
    systemctl daemon-reload
    systemctl enable $SERVICE_NAME
    systemctl start $SERVICE_NAME
    
    # 创建服务管理卡片
    create_service_card "$INSTALL_DIR" "$VAN_NAV_PATH"
    
    # 显示结果
    echo ""
    echo "========================================"
    echo "Van-Nav 服务设置完成！"
    echo "========================================"
    echo "可执行文件: $VAN_NAV_PATH"
    echo "工作目录: $INSTALL_DIR" 
    echo "服务名称: $SERVICE_NAME"
    echo "监听端口: $PORT"
    echo "访问地址: http://$(hostname -I | awk '{print $1}'):$PORT"
    echo "默认账号: admin / admin"
    echo "管理卡片: $(pwd)/$CARD_FILE"
    echo ""
    echo "等待服务启动..."
    sleep 3
    
    # 检查服务状态
    if systemctl is-active --quiet $SERVICE_NAME; then
        echo "✅ 服务运行正常"
    else
        echo "⚠️  服务启动可能有问题，请检查日志"
    fi
    
    systemctl status $SERVICE_NAME --no-pager --lines=5
    
    # 显示卡片内容摘要
    echo ""
    echo "=== 快捷命令 ==="
    echo "启动: sudo systemctl start $SERVICE_NAME"
    echo "停止: sudo systemctl stop $SERVICE_NAME" 
    echo "状态: sudo systemctl status $SERVICE_NAME"
    echo "日志: sudo journalctl -u $SERVICE_NAME -f"
    echo ""
    echo "详细管理指南请查看: $(pwd)/$CARD_FILE"
    
    # 显示卡片内容（可选，取消注释以下行以显示完整卡片）
    # show_service_card
}

# 如果提供了路径参数，使用该路径
if [ $# -eq 1 ]; then
    VAN_NAV_PATH="$1"
    if [ ! -f "$VAN_NAV_PATH" ]; then
        echo "错误: 文件不存在: $VAN_NAV_PATH"
        exit 1
    fi
    INSTALL_DIR=$(dirname "$VAN_NAV_PATH")
    
    # 切换到文件所在目录
    cd "$INSTALL_DIR"
fi

main "$@"