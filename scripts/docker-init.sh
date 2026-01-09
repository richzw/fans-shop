#!/bin/bash

# Docker 环境初始化脚本
# 用于初始化管理员账户

echo "等待 MongoDB 启动..."
sleep 5

echo "初始化管理员账户..."
docker exec fans-shop-server node utils/initAdmin.js

echo "完成！"
echo "管理员账户: admin / admin123"
