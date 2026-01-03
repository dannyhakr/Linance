@echo off
echo Fixing better-sqlite3 installation...
echo.

REM Clean everything
echo Cleaning npm cache and node_modules...
call npm cache clean --force
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del package-lock.json

echo.
echo Installing dependencies (this may take a few minutes)...
echo.

REM Try installing with build flags
call npm install --build-from-source better-sqlite3

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ========================================
    echo Installation failed!
    echo ========================================
    echo.
    echo You need to install Windows Build Tools first:
    echo.
    echo Option 1: Install Visual Studio Build Tools
    echo   Download: https://visualstudio.microsoft.com/downloads/
    echo   Install "Desktop development with C++" workload
    echo.
    echo Option 2: Use Chocolatey (run as Administrator)
    echo   choco install visualstudio2022buildtools -y
    echo.
    echo Then run: npm install
    echo.
    pause
    exit /b 1
)

echo.
echo Installing remaining dependencies...
call npm install

echo.
echo ========================================
echo Installation complete!
echo ========================================
echo.
echo Now run: npm run dev
echo.
pause

