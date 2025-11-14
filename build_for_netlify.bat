@echo off
REM Build script for manual Netlify deployment

echo Building Frankenstein Neural Web for Netlify...
echo.

REM Run the main build
call build.bat
if %ERRORLEVEL% NEQ 0 (
    echo Build failed!
    exit /b 1
)

echo.
echo Creating deployment folder...

REM Clean and create dist directory
if exist dist rmdir /s /q dist
mkdir dist

REM Copy web files
echo Copying web files...
copy src\web\index.html dist\
copy src\web\style.css dist\
copy src\web\app.js dist\
copy src\web\encoder.js dist\
copy src\web\modal-manager.js dist\

REM Copy WASM files
echo Copying WASM files...
copy build\neurobrain.js dist\
copy build\neurobrain.wasm dist\

echo.
echo ========================================
echo BUILD COMPLETE!
echo ========================================
echo.
echo Your deployment folder is ready: dist\
echo.
echo Next steps:
echo 1. Go to https://app.netlify.com/drop
echo 2. Drag the 'dist' folder to the upload area
echo 3. Your app will be live instantly!
echo.
echo Files ready for deployment:
dir /b dist
echo.
