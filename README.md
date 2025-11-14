# Frankenstein Neural Web ⚡

A browser-based artificial neural network with WebAssembly SIMD optimization. Train networks on CSV data with mixed numeric and categorical features.

## Quick Start

1. **Build**: `./build.sh` (Linux/Mac) or `.\build.bat` (Windows)
2. **Serve**: `python -m http.server 8000`
3. **Open**: `http://localhost:8000/src/web/index.html`

## Prerequisites

- Emscripten SDK (https://emscripten.org/docs/getting_started/downloads.html)
- Python 3 (for local server)
- Modern browser with WebAssembly support

## CSV Format

```csv
x1,x2,x3,y
0.1,0.2,0.3,0.45
0.2,0.4,0.6,0.85
```

**Requirements:**
- Headers: `x1,x2,...,xN,y` (1-10 inputs)
- Values: Numeric or categorical strings
- Last column: Output value (y)

## Architecture

- **Input Layer**: 1-10 neurons
- **Hidden Layer**: 6 neurons
- **Output Layer**: 1 neuron
- **Tech**: WebAssembly SIMD + C + JavaScript

## Troubleshooting

**"emcc: command not found"**
```bash
source /path/to/emsdk/emsdk_env.sh  # Linux/Mac
emsdk_env.bat                        # Windows
```

**WASM module fails to load**
- Use `http://` not `file://`
- Check browser console for errors

**CSV validation fails**
- Verify format: `x1,x2,...,xN,y`
- Check for trailing commas or empty rows

**Training produces NaN**
- Normalize data to [0, 1] range
- Ensure sufficient samples (10+ rows)

## Testing

Run integration tests:
```bash
python -m http.server 8000
# Open: http://localhost:8000/test_integration.html
```

See `TESTING.md` and `INTEGRATION_TEST_CHECKLIST.md` for detailed test procedures.

## License

MIT License - see LICENSE.md for details.
