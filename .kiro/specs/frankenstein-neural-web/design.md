# Design Document

## Overview

The Frankenstein Neural Web implements a three-layer feedforward neural network with real gradient descent training, compiled from x86-64 assembly and C to WebAssembly. The system architecture separates concerns into three main layers: the low-level computation core (assembly), the orchestration layer (C), and the user interface (web technologies).

The design prioritizes authentic mathematical computation over simulation, leveraging assembly for performance-critical operations while maintaining clean interfaces between components.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                      Web Interface Layer                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ CSV Parser   │  │ Training UI  │  │ Prediction UI    │  │
│  │ (app.js)     │  │ (app.js)     │  │ (app.js)         │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────────┘  │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                    WASM Bridge (Emscripten)                  │
│         Memory Management │ Function Exports                 │
└─────────────────────────────────────────────────────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                   C Orchestration Layer                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  ann_wrapper.c                                       │   │
│  │  - train_ann()      : Training loop coordinator      │   │
│  │  - run_ann()        : Inference coordinator          │   │
│  │  - init_network()   : Weight initialization          │   │
│  │  - compute_loss()   : Error aggregation              │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│              Assembly Computation Core (ann.s)               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ dot_product  │  │ sigmoid      │  │ update_weights   │  │
│  │ (SIMD opt)   │  │ sigmoid_deriv│  │ (vectorized)     │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

**Training Flow:**
1. User uploads CSV → JavaScript FileReader API reads file
2. CSV Parser validates headers and converts to Float32Array
3. JavaScript allocates WASM memory and copies data
4. Calls `train_ann(inputs_ptr, outputs_ptr, n_rows, n_inputs)`
5. C layer initializes network weights randomly
6. For each epoch:
   - For each training sample:
     - Assembly computes forward pass (dot products + activations)
     - C layer computes error
     - Assembly computes backward pass (gradients)
     - Assembly updates weights
7. Returns final loss to JavaScript
8. JavaScript displays completion and enables prediction UI

**Prediction Flow:**
1. User enters values → JavaScript collects into Float32Array
2. JavaScript allocates WASM memory and copies input
3. Calls `run_ann(input_ptr, n_inputs)`
4. Assembly computes forward pass with trained weights
5. Returns single float prediction
6. JavaScript displays result

## Components and Interfaces

### Assembly Module (ann.s)

**Purpose:** Implement performance-critical mathematical operations using x86-64 SIMD instructions where possible.

**Functions:**

```c
// Compute dot product of two vectors
// Parameters: rdi = vec1_ptr, rsi = vec2_ptr, rdx = length
// Returns: xmm0 = dot product result (float)
float dot_product(float* vec1, float* vec2, int length);

// Apply sigmoid activation: 1 / (1 + e^(-x))
// Parameters: xmm0 = input value
// Returns: xmm0 = sigmoid(input)
float sigmoid(float x);

// Compute sigmoid derivative: sigmoid(x) * (1 - sigmoid(x))
// Parameters: xmm0 = sigmoid output value
// Returns: xmm0 = derivative
float sigmoid_derivative(float sigmoid_out);

// Update weight vector using gradient descent
// Parameters: rdi = weights_ptr, rsi = gradients_ptr, 
//             xmm0 = learning_rate, rdx = length
// Returns: void (modifies weights in place)
void update_weights(float* weights, float* gradients, float lr, int length);
```

**Implementation Notes:**
- Use SSE/AVX instructions for vectorized operations where vector length ≥ 4
- For sigmoid, use polynomial approximation or lookup table for e^x
- Maintain 16-byte stack alignment for WASM compatibility
- Use scalar fallback for remainder elements in SIMD loops

### C Orchestration Layer (ann_wrapper.c)

**Purpose:** Manage network state, coordinate training loops, and provide clean WASM exports.

**Data Structures:**

```c
typedef struct {
    int n_inputs;        // 1-10
    int n_hidden;        // 4-8 (configurable)
    int n_outputs;       // Always 1
    
    float* weights_ih;   // Input to hidden: [n_inputs * n_hidden]
    float* weights_ho;   // Hidden to output: [n_hidden * n_outputs]
    float* bias_h;       // Hidden biases: [n_hidden]
    float* bias_o;       // Output bias: [n_outputs]
    
    float* hidden_activations;  // Temporary storage
    float* output_activation;   // Temporary storage
} NeuralNetwork;
```

**Exported Functions:**

```c
// Initialize and train the network
// Returns: final training loss
EMSCRIPTEN_KEEPALIVE
float train_ann(float* inputs, float* outputs, int n_rows, int n_inputs);

// Run inference on new input
// Returns: predicted output value
EMSCRIPTEN_KEEPALIVE
float run_ann(float* input, int n_inputs);

// Optional: Get network configuration
EMSCRIPTEN_KEEPALIVE
void get_network_info(int* n_inputs, int* n_hidden, int* n_outputs);
```

**Training Algorithm:**

```
function train_ann(inputs, outputs, n_rows, n_inputs):
    network = init_network(n_inputs, n_hidden=6, n_outputs=1)
    learning_rate = 0.01
    epochs = 300
    
    for epoch in 1..epochs:
        total_loss = 0
        
        for i in 0..n_rows-1:
            // Forward pass
            input_row = inputs[i * n_inputs : (i+1) * n_inputs]
            
            // Input to hidden
            for h in 0..n_hidden-1:
                weights_slice = weights_ih[h * n_inputs : (h+1) * n_inputs]
                z_h = dot_product(input_row, weights_slice, n_inputs) + bias_h[h]
                hidden_activations[h] = sigmoid(z_h)
            
            // Hidden to output
            z_o = dot_product(hidden_activations, weights_ho, n_hidden) + bias_o[0]
            output_activation = sigmoid(z_o)
            
            // Compute error
            error = output_activation - outputs[i]
            total_loss += error * error
            
            // Backward pass
            // Output layer gradient
            delta_o = error * sigmoid_derivative(output_activation)
            
            // Hidden layer gradients
            for h in 0..n_hidden-1:
                delta_h[h] = delta_o * weights_ho[h] * sigmoid_derivative(hidden_activations[h])
            
            // Update weights
            // Hidden to output weights
            for h in 0..n_hidden-1:
                weights_ho[h] -= learning_rate * delta_o * hidden_activations[h]
            bias_o[0] -= learning_rate * delta_o
            
            // Input to hidden weights
            for h in 0..n_hidden-1:
                for i in 0..n_inputs-1:
                    weights_ih[h * n_inputs + i] -= learning_rate * delta_h[h] * input_row[i]
                bias_h[h] -= learning_rate * delta_h[h]
        
        // Optional: early stopping if loss < threshold
        if total_loss / n_rows < 0.001:
            break
    
    return total_loss / n_rows
```

### Web Interface Layer

**File Structure:**
- `index.html`: DOM structure and semantic markup
- `style.css`: Frankenstein laboratory theme styling
- `app.js`: Application logic and WASM integration

**app.js Key Functions:**

```javascript
// CSV validation and parsing
function parseCSV(fileContent) {
    const lines = fileContent.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    // Validate header pattern: x1, x2, ..., xN, y
    const inputHeaders = headers.slice(0, -1);
    const outputHeader = headers[headers.length - 1];
    
    if (outputHeader !== 'y') return { error: 'Last column must be "y"' };
    
    for (let i = 0; i < inputHeaders.length; i++) {
        if (inputHeaders[i] !== `x${i + 1}`) {
            return { error: `Column ${i + 1} must be "x${i + 1}"` };
        }
    }
    
    if (inputHeaders.length < 1 || inputHeaders.length > 10) {
        return { error: 'Must have 1-10 input columns' };
    }
    
    // Parse data rows
    const data = [];
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => parseFloat(v.trim()));
        if (values.some(isNaN)) {
            return { error: `Row ${i + 1} contains non-numeric values` };
        }
        data.push(values);
    }
    
    return {
        n_inputs: inputHeaders.length,
        inputs: data.flatMap(row => row.slice(0, -1)),
        outputs: data.map(row => row[row.length - 1]),
        n_rows: data.length
    };
}

// WASM module initialization
async function initWASM() {
    const module = await Module();
    return {
        train: module.cwrap('train_ann', 'number', ['number', 'number', 'number', 'number']),
        predict: module.cwrap('run_ann', 'number', ['number', 'number']),
        malloc: module._malloc,
        free: module._free,
        HEAPF32: module.HEAPF32
    };
}

// Training execution
async function trainNetwork(parsedData) {
    const { n_inputs, inputs, outputs, n_rows } = parsedData;
    
    // Allocate WASM memory
    const inputsPtr = wasm.malloc(inputs.length * 4);
    const outputsPtr = wasm.malloc(outputs.length * 4);
    
    // Copy data to WASM heap
    wasm.HEAPF32.set(new Float32Array(inputs), inputsPtr / 4);
    wasm.HEAPF32.set(new Float32Array(outputs), outputsPtr / 4);
    
    // Display training messages
    updateStatus('[CORE] Reanimation sequence initiated...');
    updateStatus('[LEARNING] Synaptic calibration in progress...');
    
    // Call training function
    const finalLoss = wasm.train(inputsPtr, outputsPtr, n_rows, n_inputs);
    
    // Cleanup
    wasm.free(inputsPtr);
    wasm.free(outputsPtr);
    
    updateStatus(`[STATUS] Training complete. Final loss: ${finalLoss.toFixed(6)}`);
    
    return finalLoss;
}

// Prediction execution
function makePrediction(inputValues) {
    const inputPtr = wasm.malloc(inputValues.length * 4);
    wasm.HEAPF32.set(new Float32Array(inputValues), inputPtr / 4);
    
    const prediction = wasm.predict(inputPtr, inputValues.length);
    
    wasm.free(inputPtr);
    
    return prediction;
}
```

## Data Models

### Training Data Format

**CSV Structure:**
```
x1,x2,x3,y
0.1,0.2,0.3,0.5
0.4,0.5,0.6,0.8
...
```

**In-Memory Representation:**
- Inputs: Flat Float32Array of length `n_rows * n_inputs`
- Outputs: Float32Array of length `n_rows`
- Row-major order for input matrix

### Network Weights

**Storage Layout:**
- Input-to-Hidden weights: `[n_inputs * n_hidden]` flat array
- Hidden-to-Output weights: `[n_hidden * 1]` flat array
- Hidden biases: `[n_hidden]` array
- Output bias: Single float

**Initialization:**
- Xavier/Glorot initialization: `weight ~ Uniform(-sqrt(6/(n_in + n_out)), sqrt(6/(n_in + n_out)))`
- Biases initialized to 0.0

## Error Handling

### CSV Validation Errors

**Invalid Header Format:**
- Detection: Regex match against `^x1(,x\d+)*,y$`
- Response: Display error message, disable training button
- User action: Re-upload corrected file

**Non-Numeric Data:**
- Detection: `parseFloat()` returns `NaN`
- Response: Display row number and error message
- User action: Clean data and re-upload

**Dimension Mismatch:**
- Detection: Input count < 1 or > 10
- Response: Display constraint message
- User action: Adjust dataset features

### Training Errors

**Memory Allocation Failure:**
- Detection: `malloc()` returns null pointer
- Response: Display "Insufficient memory" error
- Recovery: Reduce dataset size or hidden layer neurons

**Numerical Instability:**
- Detection: Loss becomes NaN or Infinity
- Response: Display "Training diverged" error
- Recovery: Reduce learning rate or normalize input data

### Prediction Errors

**Dimension Mismatch:**
- Detection: Input array length ≠ trained network input count
- Response: Display "Input dimension mismatch" error
- User action: Provide correct number of inputs

## Testing Strategy

### Unit Testing

**Assembly Functions:**
- Test `dot_product` with known vectors (e.g., [1,2,3] · [4,5,6] = 32)
- Test `sigmoid` with boundary values (0, large positive, large negative)
- Test `sigmoid_derivative` against analytical formula
- Test `update_weights` with simple gradient arrays

**C Functions:**
- Test `init_network` produces weights in expected range
- Test forward pass with known weights produces expected output
- Test backward pass computes correct gradients (compare with numerical gradients)
- Test memory allocation and deallocation

**JavaScript Functions:**
- Test CSV parser with valid and invalid formats
- Test WASM memory management (no leaks)
- Test UI state transitions (upload → validate → train → predict)

### Integration Testing

**End-to-End Training:**
- Use simple XOR-like dataset with known solution
- Verify network converges to low loss (< 0.01)
- Verify predictions match expected outputs within tolerance

**Cross-Browser Compatibility:**
- Test on Chrome, Firefox, Safari
- Verify WASM loads and executes correctly
- Verify UI renders consistently

### Performance Testing

**Training Speed:**
- Measure epochs per second for various dataset sizes
- Target: > 100 epochs/sec for 100 samples with 5 inputs

**Memory Usage:**
- Monitor WASM heap growth during training
- Verify no memory leaks after multiple train/predict cycles

## Build Configuration

### Emscripten Compilation

**Command:**
```bash
emcc src/c/ann_wrapper.c src/asm/ann.s \
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
```

**Flags Explanation:**
- `-O3`: Maximum optimization
- `-msimd128`: Enable WebAssembly SIMD
- `ALLOW_MEMORY_GROWTH`: Dynamic heap sizing
- `MODULARIZE`: ES6 module export
- `INITIAL_MEMORY`: Starting heap size

### Development Workflow

1. Edit assembly/C source files
2. Run build command
3. Serve `build/` directory with local HTTP server
4. Open `index.html` in browser
5. Test with sample CSV files
6. Iterate on implementation

### Deployment

**Static Hosting:**
- Upload `build/` directory contents to web server
- Ensure MIME type for `.wasm` is `application/wasm`
- Enable gzip compression for `.js` and `.wasm` files

**CORS Considerations:**
- If loading WASM from different origin, ensure proper CORS headers
- For local development, use `python -m http.server` or similar

## Visual Design

### Theme: Frankenstein Laboratory

**Color Palette:**
- Background: `#0a0a0a` (near black)
- Primary text: `#00ff41` (neon green)
- Secondary text: `#33ff77` (lighter green)
- Error text: `#ff3333` (red)
- Accent: `#ffaa00` (amber)

**Typography:**
- Monospace font: `'Courier New', 'Consolas', monospace`
- Terminal-style text rendering

**Visual Effects:**
- CRT scanline overlay (subtle horizontal lines)
- Text glow effect using `text-shadow`
- Pulsing animation for "Training in progress" indicator
- Flicker effect on status updates

**Layout:**
- Centered container with max-width 800px
- Card-based sections with subtle borders
- Responsive design for mobile devices

### UI Components

**File Upload Area:**
- Drag-and-drop zone with dashed border
- File icon and instruction text
- Highlight on hover/drag-over

**Training Status Terminal:**
- Scrollable text area with monospace font
- Auto-scroll to latest message
- Timestamp prefix for each message

**Prediction Input Form:**
- Dynamically generated input fields (x1, x2, ...)
- Number input type with step="any"
- Large "Predict" button with glow effect

**Output Display:**
- Large numeric display for ŷ value
- Animated reveal on prediction complete
- Precision: 4 decimal places

## Security Considerations

**Input Validation:**
- Limit CSV file size to 10MB maximum
- Sanitize all user inputs before display (prevent XSS)
- Validate numeric ranges to prevent overflow

**Memory Safety:**
- Bounds checking on all array accesses
- Proper cleanup of allocated WASM memory
- Prevent buffer overflows in assembly code

**Resource Limits:**
- Cap maximum training epochs to prevent infinite loops
- Timeout mechanism for long-running training
- Limit maximum dataset size to prevent memory exhaustion

## Future Enhancements

**Potential Extensions:**
- Support for multiple output neurons (multi-class classification)
- Configurable hidden layer size via UI
- Visualization of network weights and activations
- Export/import trained model weights
- Real-time loss curve plotting during training
- Support for different activation functions (ReLU, tanh)
- Mini-batch gradient descent for larger datasets
- Momentum or Adam optimizer
