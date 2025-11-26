@echo off
echo Building project...
call npm run build

echo.
echo Entering dist directory...
cd dist

echo.
echo Initializing git repository...
git init
git add -A
git commit -m "deploy"

echo.
echo Deploying to GitHub Pages...
git push -f https://github.com/lekoon/CTPMtool.git main:gh-pages

cd ..

echo.
echo ========================================
echo Deployment complete!
echo Your site will be available at:
echo https://lekoon.github.io/CTPMtool/
echo ========================================
pause
