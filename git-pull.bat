@echo off
chcp 65001 >nul
title ExpediLog - Pull from GitHub
cls
echo ========================================================
echo        📥 ExpediLog - Tarik Pembaruan dari GitHub
echo ========================================================
echo.

where git >nul 2>&1
if %errorlevel% neq 0 (
    set "PATH=%LOCALAPPDATA%\Microsoft\WinGet\Packages\Git.MinGit_Microsoft.Winget.Source_8wekyb3d8bbwe\cmd;%PATH%"
)

git pull origin main

echo.
pause
