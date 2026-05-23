# AIPET 内存优化启动脚本 (PowerShell)

param(
    [string]$Mode = ""
)

Write-Host "🚀 AIPET 内存优化启动脚本" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

if ([string]::IsNullOrEmpty($Mode)) {
    Write-Host "使用方法：" -ForegroundColor Yellow
    Write-Host "  .\start-optimized.ps1 -Mode <mode>" -ForegroundColor White
    Write-Host ""
    Write-Host "可用模式：" -ForegroundColor Yellow
    Write-Host "  dev       - 开发模式（启用所有调试功能）" -ForegroundColor White
    Write-Host "  prod      - 生产模式（最小化内存占用）" -ForegroundColor White
    Write-Host "  gpu-fix   - GPU 问题修复模式" -ForegroundColor White
    Write-Host "  perf      - 性能测试模式（启用内存监控）" -ForegroundColor White
    Write-Host ""
    Write-Host "示例：" -ForegroundColor Yellow
    Write-Host "  .\start-optimized.ps1 -Mode dev" -ForegroundColor White
    Write-Host "  .\start-optimized.ps1 -Mode prod" -ForegroundColor White
    exit 1
}

switch ($Mode.ToLower()) {
    "dev" {
        Write-Host "📝 启动开发模式..." -ForegroundColor Green
        Write-Host "  - 启用详细日志" -ForegroundColor Gray
        Write-Host "  - 启用 DevTools" -ForegroundColor Gray
        Write-Host "  - 启用诊断定时器" -ForegroundColor Gray
        Write-Host "  - 启用内存监控" -ForegroundColor Gray
        $env:DEBUG = "true"
        $env:DISABLE_GPU = "false"
        $env:NODE_ENV = "development"
    }
    "prod" {
        Write-Host "⚡ 启动生产模式..." -ForegroundColor Green
        Write-Host "  - 禁用详细日志" -ForegroundColor Gray
        Write-Host "  - 禁用 DevTools" -ForegroundColor Gray
        Write-Host "  - 启用 GPU 加速" -ForegroundColor Gray
        Write-Host "  - 最小化内存占用" -ForegroundColor Gray
        $env:DEBUG = "false"
        $env:DISABLE_GPU = "false"
        $env:NODE_ENV = "production"
    }
    "gpu-fix" {
        Write-Host "🔧 启动 GPU 问题修复模式..." -ForegroundColor Green
        Write-Host "  - 禁用详细日志" -ForegroundColor Gray
        Write-Host "  - 禁用 GPU 加速" -ForegroundColor Gray
        Write-Host "  - 使用软件光栅化" -ForegroundColor Gray
        $env:DEBUG = "false"
        $env:DISABLE_GPU = "true"
        $env:NODE_ENV = "production"
    }
    "perf" {
        Write-Host "📊 启动性能测试模式..." -ForegroundColor Green
        Write-Host "  - 启用内存监控" -ForegroundColor Gray
        Write-Host "  - 启用诊断定时器" -ForegroundColor Gray
        Write-Host "  - 启用 GPU 加速" -ForegroundColor Gray
        $env:DEBUG = "true"
        $env:DISABLE_GPU = "false"
        $env:NODE_ENV = "production"
    }
    default {
        Write-Host "❌ 未知模式: $Mode" -ForegroundColor Red
        Write-Host "可用模式: dev, prod, gpu-fix, perf" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host ""
Write-Host "环境变量设置：" -ForegroundColor Cyan
Write-Host "  DEBUG=$($env:DEBUG)" -ForegroundColor White
Write-Host "  DISABLE_GPU=$($env:DISABLE_GPU)" -ForegroundColor White
Write-Host "  NODE_ENV=$($env:NODE_ENV)" -ForegroundColor White
Write-Host ""
Write-Host "启动应用..." -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# 启动应用
yarn dev:electron
