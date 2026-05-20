@echo off
echo ========================================
echo Live2D Chat App 启动脚本
echo ========================================
echo.

echo 1. 启动Vite开发服务器...
start "" "C:\Program Files\nodejs\npx.cmd" vite

echo.
echo 2. 等待服务器启动...
timeout /t 5 /nobreak >nul

echo.
echo ========================================
echo 应用已启动！
echo.
echo 访问地址:
echo   http://localhost:5174/index.html
echo.
echo 或者直接在浏览器中打开:
echo   http://localhost:5174/index.html
echo ========================================
echo.
echo 按任意键关闭此窗口...
pause >nul
