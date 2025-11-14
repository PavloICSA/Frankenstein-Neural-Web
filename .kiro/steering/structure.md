# Project Structure

## Directory Organization

```
frankenstein-neural-web/
├── src/                    # Source code
│   ├── asm/               # SIMD implementations
│   │   └── ann_simd.c     # WebAssembly SIMD computation core
│   ├── c/                 # C orchestration layer
│   │   └── ann_wrapper.c  # Network state management, training/inference
│   ├── web/               # Web interface
│   │   ├── index.html     # Main HTML structure
│   │   ├── style.css      # Frankenstein theme styling
│   │   └── app.js         # JavaScript logic and WASM integration
│   └── data/              # Sample datasets
│       └── sample.csv     # Example training data
├── build/                 # Build output (generated)
│   ├── neurobrain.js      # WASM wrapper
│   └── neurobrain.wasm    # Compiled WebAssembly
├── build.sh               # Linux/Mac build script
├── build.bat              # Windows build script
└── README.md              # Documentation
```

## Architecture Layers

1. **SIMD Layer** (`src/asm/`): Performance-critical operations using WebAssembly SIMD (dot product, sigmoid, weight updates)
2. **C Layer** (`src/c/`): Network orchestration, memory management, training/inference coordination
3. **Web Layer** (`src/web/`): UI, CSV parsing, WASM integration, user interactions

## Code Organization Principles

- SIMD functions are declared as `extern` in C and called directly
- C functions exposed to JavaScript use `EMSCRIPTEN_KEEPALIVE` macro
- JavaScript wraps WASM functions using `cwrap` for type-safe calls
- Global network state maintained in C layer
- Memory allocation/deallocation handled via exported `malloc`/`free`

## Data Flow

CSV Upload → JavaScript Parser → WASM Memory → C Training Loop → SIMD Computations → Updated Weights → Prediction Output
