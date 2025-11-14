#!/bin/bash
set -e

echo "=========================================="
echo "Building Frankenstein Neural Web for Netlify"
echo "=========================================="

# Install Emscripten if not already installed
if [ ! -d "$HOME/emsdk" ]; then
    echo "Installing Emscripten SDK..."
    cd $HOME
    git clone https://github.com/emscripten-core/emsdk.git
    cd emsdk
    ./emsdk install ${EMSDK_VERSION:-3.1.47}
    ./emsdk activate ${EMSDK_VERSION:-3.1.47}
fi

# Source Emscripten environment
source $HOME/emsdk/emsdk_env.sh

# Return to build directory
cd $OLDPWD

echo ""
echo "Compiling WebAssembly with SIMD..."
emcc src/asm/ann_simd.c src/c/ann_wrapper.c \
    -o build/neurobrain.js \
    -O3 \
    -msimd128 \
    -s WASM=1 \
    -s ALLOW_MEMORY_GROWTH=1 \
    -s INITIAL_MEMORY=16MB \
    -s EXPORTED_FUNCTIONS='["_train_ann","_run_ann","_malloc","_free"]' \
    -s EXPORTED_RUNTIME_METHODS='["cwrap","HEAPF32"]'

echo ""
echo "Creating deployment folder..."
rm -rf dist
mkdir -p dist

echo "Copying files to dist..."
cp src/web/index.html dist/
cp src/web/style.css dist/
cp src/web/app.js dist/
cp src/web/encoder.js dist/
cp src/web/modal-manager.js dist/
cp build/neurobrain.js dist/
cp build/neurobrain.wasm dist/

echo ""
echo "=========================================="
echo "BUILD COMPLETE!"
echo "=========================================="
echo "Files ready in dist/ folder"
ls -la dist/
