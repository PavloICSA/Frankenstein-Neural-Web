# Technology Stack

## Core Technologies

- **WebAssembly SIMD**: Low-level optimized operations using WASM SIMD intrinsics (`-msimd128`)
- **C**: Network orchestration and memory management
- **Emscripten**: Compiles C and SIMD code to WebAssembly
- **JavaScript**: Vanilla JS (no frameworks) for UI and WASM integration
- **HTML/CSS**: Web interface with Frankenstein theme

## Build System

**Compiler**: Emscripten (emcc) - compiles C and WebAssembly SIMD to WebAssembly

**Build Scripts**:
- Linux/Mac: `./build.sh`
- Windows: `build.bat`

**Build Output**:
- `build/neurobrain.js` - WASM wrapper
- `build/neurobrain.wasm` - Compiled WebAssembly module

**Emscripten Flags**:
- `-O3` - Maximum optimization
- `-msimd128` - Enable SIMD instructions
- `-s WASM=1` - WebAssembly output
- `-s ALLOW_MEMORY_GROWTH=1` - Dynamic memory allocation
- `-s INITIAL_MEMORY=16MB` - Initial heap size
- Exported functions: `train_ann`, `run_ann`, `malloc`, `free`
- Exported runtime methods: `cwrap`, `HEAPF32`

## Common Commands

```bash
# Build the project
./build.sh          # Linux/Mac
build.bat           # Windows

# Run local development server
python -m http.server 8000

# Access application
# Navigate to: http://localhost:8000/src/web/index.html
```

## Dependencies

**Required**:
- Emscripten SDK (verify with `emcc --version`)

**Optional**:
- Python 3 (for local web server)
- Modern web browser with WebAssembly SIMD support (Chrome 91+, Firefox 89+, Safari 16.4+)
