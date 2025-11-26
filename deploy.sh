#!/bin/bash

# 构建项目
echo "Building project..."
npm run build

# 进入构建输出目录
cd dist

# 初始化 git 仓库
git init
git add -A
git commit -m 'deploy'

# 推送到 gh-pages 分支
echo "Deploying to GitHub Pages..."
git push -f git@github.com:lekoon/CTPMtool.git main:gh-pages

cd -

echo "Deployment complete!"
echo "Your site will be available at: https://lekoon.github.io/CTPMtool/"
