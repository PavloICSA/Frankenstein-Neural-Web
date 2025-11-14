#!/bin/bash

# Frankenstein Neural Web - Setup Verification Script

echo "⚡ FRANKENSTEIN NEURAL WEB - SETUP VERIFICATION ⚡"
echo ""

# Check Emscripten
echo "[1/4] Checking Emscripten..."
if command -v emcc &> /dev/null; then
    VERSION=$(emcc --version | head -n 1)
    echo "  ✓ Emscripten found: $VERSION"
else
    echo "  ✗ Emscripten not found"
    echo "    Install from: https://emscripten.org/docs/getting_started/downloads.html"
    exit 1
fi

# Check build files
echo ""
echo "[2/4] Checking build output..."
if [ -f "build/neurobrain.js" ] && [ -f "build/neurobrain.wasm" ]; then
    echo "  ✓ Build files found"
    JS_SIZE=$(du -h build/neurobrain.js | cut -f1)
    WASM_SIZE=$(du -h build/neurobrain.wasm | cut -f1)
    echo "    - neurobrain.js: $JS_SIZE"
    echo "    - neurobrain.wasm: $WASM_SIZE"
else
    echo "  ✗ Build files not found"
    echo "    Run: ./build.sh"
    exit 1
fi

# Check source files
echo ""
echo "[3/4] Checking source files..."
MISSING=0
for file in "src/asm/ann.s" "src/c/ann_wrapper.c" "src/web/index.html" "src/web/app.js" "src/web/style.css"; do
    if [ -f "$file" ]; then
        echo "  ✓ $file"
    else
        echo "  ✗ $file missing"
        MISSING=1
    fi
done

if [ $MISSING -eq 1 ]; then
    exit 1
fi

# Check test files
echo ""
echo "[4/4] Checking test files..."
for file in "src/data/test_linear.csv" "src/web/test.html" "TESTING.md"; do
    if [ -f "$file" ]; then
        echo "  ✓ $file"
    else
        echo "  ✗ $file missing"
    fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✓ Setup verification complete!"
echo ""
echo "Next steps:"
echo "  1. Start web server: python -m http.server 8000"
echo "  2. Open application: http://localhost:8000/src/web/index.html"
echo "  3. Run tests: http://localhost:8000/src/web/test.html"
echo ""
echo "For detailed testing instructions, see TESTING.md"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
