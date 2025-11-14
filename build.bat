@echo off
echo Building Frankenstein Neural Web...

where emcc >nul 2>nul
if errorlevel 1 (
    echo Error: Emscripten not found
    exit /b 1
)

if not exist build md build

emcc src/c/ann_wrapper.c src/asm/ann_simd.c -o build/neurobrain.js -s EXPORTED_FUNCTIONS="[\"_train_ann\",\"_run_ann\",\"_malloc\",\"_free\"]" -s EXPORTED_RUNTIME_METHODS="[\"cwrap\",\"HEAPF32\"]" -s MODULARIZE=1 -s EXPORT_NAME="Module" -s WASM=1 -s ALLOW_MEMORY_GROWTH=1 -s INITIAL_MEMORY=16MB -O3 -msimd128

if errorlevel 1 (
    echo Build failed!
    exit /b 1
)

echo Build successful!
echo Output: build/neurobrain.js and build/neurobrain.wasm
