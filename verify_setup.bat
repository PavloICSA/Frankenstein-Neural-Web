@echo off
REM Frankenstein Neural Web - Setup Verification Script

echo ⚡ FRANKENSTEIN NEURAL WEB - SETUP VERIFICATION ⚡
echo.

REM Check Emscripten
echo [1/4] Checking Emscripten...
where emcc >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo   ✓ Emscripten found
    emcc --version | findstr /C:"emcc"
) else (
    echo   ✗ Emscripten not found
    echo     Install from: https://emscripten.org/docs/getting_started/downloads.html
    exit /b 1
)

REM Check build files
echo.
echo [2/4] Checking build output...
if exist "build\neurobrain.js" (
    if exist "build\neurobrain.wasm" (
        echo   ✓ Build files found
        for %%A in (build\neurobrain.js) do echo     - neurobrain.js: %%~zA bytes
        for %%A in (build\neurobrain.wasm) do echo     - neurobrain.wasm: %%~zA bytes
    ) else (
        echo   ✗ neurobrain.wasm not found
        echo     Run: build.bat
        exit /b 1
    )
) else (
    echo   ✗ Build files not found
    echo     Run: build.bat
    exit /b 1
)

REM Check source files
echo.
echo [3/4] Checking source files...
set MISSING=0
for %%F in (src\asm\ann.s src\c\ann_wrapper.c src\web\index.html src\web\app.js src\web\style.css) do (
    if exist "%%F" (
        echo   ✓ %%F
    ) else (
        echo   ✗ %%F missing
        set MISSING=1
    )
)

if %MISSING% EQU 1 exit /b 1

REM Check test files
echo.
echo [4/4] Checking test files...
for %%F in (src\data\test_linear.csv src\web\test.html TESTING.md) do (
    if exist "%%F" (
        echo   ✓ %%F
    ) else (
        echo   ✗ %%F missing
    )
)

echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo ✓ Setup verification complete!
echo.
echo Next steps:
echo   1. Start web server: python -m http.server 8000
echo   2. Open application: http://localhost:8000/src/web/index.html
echo   3. Run tests: http://localhost:8000/src/web/test.html
echo.
echo For detailed testing instructions, see TESTING.md
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
