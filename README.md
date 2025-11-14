# Frankenstein Neural Web ⚡

A browser-based artificial neural network with WebAssembly SIMD optimization. Train networks on CSV data with mixed numeric and categorical features, featuring configurable architectures, multiple activation functions, and real-time visualizations.

## 🚀 [Try it Now - Live Demo](https://app.netlify.com/projects/frankensteinneuralweb/overview)

## ✨ Features

- **Pre-loaded Datasets**: XOR, Linear Regression, and Iris Setosa for quick experimentation
- **Configurable Architecture**: Adjust hidden layer size from 2 to 20 neurons
- **Multiple Activation Functions**: Choose between Sigmoid, ReLU, or Tanh
- **Real-time Visualizations**: 
  - Interactive loss graph tracking training progress
  - Weight heatmaps showing learned network patterns
  - Accuracy metrics for classification tasks
- **Mixed Data Support**: Handles numeric and categorical features automatically
- **Browser-based**: Runs entirely in your browser with WebAssembly SIMD acceleration

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

- **Input Layer**: 1-10 neurons (auto-configured based on data)
- **Hidden Layer**: 2-20 neurons (user-configurable, default: 6)
- **Output Layer**: 1 neuron
- **Activation Functions**: Sigmoid, ReLU, or Tanh (user-selectable)
- **Training**: 1000 epochs with gradient descent and backpropagation
- **Tech Stack**: WebAssembly SIMD + C + JavaScript

## Network Configuration

### Activation Functions

- **Sigmoid**: Classic smooth function, ideal for binary classification (0-1 output)
- **ReLU**: Fast and efficient, great for regression and deep networks
- **Tanh**: Similar to sigmoid but outputs range from -1 to 1

### Hidden Layer Size

Adjust the number of hidden neurons to match your problem complexity:
- **2-5 neurons**: Simple patterns, faster training
- **6-10 neurons**: Moderate complexity (default: 6)
- **11-20 neurons**: Complex patterns, more learning capacity

## Visualizations

- **Loss Graph**: Real-time plot showing training error over 1000 epochs
- **Weight Heatmaps**: Visual representation of learned connections
  - Input → Hidden layer weights
  - Hidden → Output layer weights
  - Color coding: Red (positive), Blue (negative)
- **Accuracy Metrics**: Classification accuracy percentage for binary problems

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

## Pre-loaded Datasets

Three classic machine learning problems are included:

1. **XOR Problem**: Non-linear classification with 2 binary inputs
2. **Simple Linear Regression**: Continuous value prediction
3. **Iris Setosa Classification**: Binary classification from the famous Iris dataset

## License

MIT License - see LICENSE.md for details.
