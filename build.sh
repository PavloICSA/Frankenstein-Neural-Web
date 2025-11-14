#!/bin/bash
# Build script for Frankenstein Neural Web
# Compiles assembly and C code to WebAssembly using Emscripten

echo "Building Frankenstein Neural Web..."

# Check if Emscripten is installed
if ! command -v emcc &> /dev/null
then
    echo "Error: Emscripten (emcc) not found. Please install Emscripten first."
    echo "Visit: https://emscripten.org/docs/getting_started/downloads.html"
    exit 1
fi

# Create build directory if it doesn't exist
mkdir -p build

# Compile WASM SIMD and C to WebAssembly
emcc src/c/ann_wrapper.c src/asm/ann_simd.c \
  -o build/neurobrain.js \
  -s EXPORTED_FUNCTIONS='["_train_ann","_run_ann","_malloc","_free"]' \
  -s EXPORTED_RUNTIME_METHODS='["cwrap","HEAPF32"]' \
  -s MODULARIZE=1 \
  -s EXPORT_NAME='Module' \
  -s WASM=1 \
  -s ALLOW_MEMORY_GROWTH=1 \
  -s INITIAL_MEMORY=16MB \
  -O3 \
  -msimd128

if [ $? -eq 0 ]; then
    echo "Build successful! Output files:"
    echo "  - build/neurobrain.js"
    echo "  - build/neurobrain.wasm"
    echo ""
    echo "To run the application:"
    echo "  1. Start a local web server in the project root"
    echo "  2. Open src/web/index.html in your browser"
    echo ""
    echo "Example: python -m http.server 8000"
else
    echo "Build failed!"
    exit 1
fi
