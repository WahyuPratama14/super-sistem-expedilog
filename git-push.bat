@echo off
chcp 65001 >nul
title ExpediLog - Push to GitHub
cls
echo ========================================================
echo        🚀 ExpediLog - Auto Commit ^& Push ke GitHub
echo ========================================================
echo.

:: Pastikan Git MinGit ada di PATH jika belum terdeteksi
where git >nul 2>&1
if %errorlevel% neq 0 (
    set "PATH=%LOCALAPPDATA%\Microsoft\WinGet\Packages\Git.MinGit_Microsoft.Winget.Source_8wekyb3d8bbwe\cmd;%PATH%"
)

:: Cek apakah remote repository GitHub sudah terhubung
git remote get-url origin >nul 2>&1
if %errorlevel% neq 0 (
    echo [PERHATIAN] Repository GitHub belum terhubung!
    echo.
    echo Silakan masukkan URL repository GitHub Anda.
    echo Contoh: https://github.com/username/expedilog.git
    echo.
    set /p REPO_URL="URL GitHub Repository: "
    if "%REPO_URL%"=="" (
        echo [X] URL tidak boleh kosong.
        pause
        exit /b 1
    )
    git remote add origin %REPO_URL%
    echo.
    echo [✓] Remote origin berhasil dihubungkan ke: %REPO_URL%
    echo.
)

echo [*] Status perubahan file saat ini:
echo --------------------------------------------------------
git status -s
echo --------------------------------------------------------
echo.

set /p MSG="Masukkan pesan commit (Tekan Enter untuk default): "
if "%MSG%"=="" set "MSG=Update ExpediLog %date% %time%"

echo.
echo [*] Menyimpan semua perubahan (git add .)...
git add .

echo [*] Membuat commit: "%MSG%"...
git commit -m "%MSG%"

echo [*] Mengirim ke GitHub (git push origin main)...
git branch -M main
git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo ========================================================
    echo    ✓ SUKSES! Perubahan berhasil di-push ke GitHub!
    echo ========================================================
) else (
    echo.
    echo ========================================================
    echo    [!] Ada kendala saat push. 
    echo    Pastikan URL repository benar dan Anda sudah login.
    echo ========================================================
)

echo.
pause
