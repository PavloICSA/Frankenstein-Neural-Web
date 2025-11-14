# Testing Guide

## Running Tests

1. Build: `./build.sh` or `.\build.bat`
2. Serve: `python -m http.server 8000`
3. Open: `http://localhost:8000/test_integration.html`

Tests run automatically and verify:
- Training workflow
- Prediction accuracy
- Error handling
- Mixed data support

## Test Data Files

Located in `src/data/`:
- `example_mixed.csv` - Mixed numeric/categorical data
- `example_categorical.csv` - Categorical-only data
- `example_numeric.csv` - Numeric-only data

## Browser Compatibility

- Chrome 91+
- Firefox 89+
- Safari 16.4+
- Edge 91+

All require WebAssembly SIMD support.
