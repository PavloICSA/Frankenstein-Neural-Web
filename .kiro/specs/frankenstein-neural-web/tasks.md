# Implementation Plan

- [x] 1. Initialize project structure and build configuration





  - Create directory structure: `/src/asm/`, `/src/c/`, `/src/web/`, `/src/data/`, `/build/`
  - Create placeholder files: `ann.s`, `ann_wrapper.c`, `index.html`, `style.css`, `app.js`
  - Write Emscripten build script with proper compilation flags and exports
  - Create sample CSV file with 3 inputs (x1, x2, x3) and output (y) for testing
  - _Requirements: 7.1, 7.2, 7.5_

- [x] 2. Implement assembly computation core (ann.s)





  - [x] 2.1 Implement dot_product function in x86-64 assembly


    - Write function prologue with proper stack alignment
    - Implement vectorized loop using SSE instructions for 4-element chunks
    - Implement scalar loop for remainder elements
    - Write function epilogue and return result in xmm0
    - _Requirements: 2.2, 5.1_
  

  - [x] 2.2 Implement sigmoid activation function in assembly

    - Implement exponential approximation using polynomial or lookup table
    - Compute 1 / (1 + e^(-x)) formula
    - Handle edge cases (very large positive/negative inputs)
    - Return result in xmm0
    - _Requirements: 2.3, 5.2_
  


  - [x] 2.3 Implement sigmoid_derivative function in assembly

    - Compute sigmoid(x) * (1 - sigmoid(x)) formula
    - Optimize for case where sigmoid output is already computed
    - Return result in xmm0
    - _Requirements: 2.5, 5.2_
  



  - [x] 2.4 Implement update_weights function in assembly

    - Write vectorized weight update loop: weights[i] -= lr * gradients[i]
    - Use SSE instructions for 4-element chunks
    - Implement scalar loop for remainder
    - _Requirements: 2.6, 5.3_

- [x] 3. Implement C orchestration layer (ann_wrapper.c)





  - [x] 3.1 Define NeuralNetwork struct and global state


    - Define struct with weight arrays, bias arrays, and activation buffers
    - Declare global network instance
    - Include Emscripten headers and assembly function declarations
    - _Requirements: 2.1, 5.4_
  

  - [x] 3.2 Implement init_network function

    - Allocate memory for all weight and bias arrays based on network dimensions
    - Initialize weights using Xavier/Glorot initialization (random uniform distribution)
    - Initialize biases to zero
    - Allocate temporary activation buffers
    - _Requirements: 2.1_
  

  - [x] 3.3 Implement forward propagation logic


    - Write compute_forward_pass function that takes input array
    - Compute input-to-hidden layer: call dot_product and sigmoid for each hidden neuron
    - Compute hidden-to-output layer: call dot_product and sigmoid for output neuron
    - Store activations in temporary buffers
    - _Requirements: 2.2, 2.3_

  
  - [x] 3.4 Implement backward propagation logic

    - Write compute_backward_pass function that takes target output
    - Compute output layer delta: error * sigmoid_derivative
    - Compute hidden layer deltas: propagate error backward through weights
    - Store gradients for weight updates
    - _Requirements: 2.5_
  

  - [x] 3.5 Implement train_ann exported function

    - Parse input parameters (inputs, outputs, n_rows, n_inputs)
    - Call init_network with appropriate dimensions (n_hidden = 6)
    - Implement training loop for 300 epochs
    - For each epoch, iterate through all training samples
    - Call forward pass, compute error, call backward pass, update weights
    - Compute and accumulate loss (squared error)
    - Return final average loss
    - Mark function with EMSCRIPTEN_KEEPALIVE
    - _Requirements: 2.4, 2.6, 3.1, 5.4_
  

  - [x] 3.6 Implement run_ann exported function

    - Parse input parameters (input array, n_inputs)
    - Validate that network is trained (weights exist)
    - Call forward pass with provided input
    - Return output activation value
    - Mark function with EMSCRIPTEN_KEEPALIVE
    - _Requirements: 4.2, 4.3, 5.5_

- [x] 4. Implement web interface HTML structure (index.html)





  - Create semantic HTML structure with header, main sections, and footer
  - Add file upload section with input element and drag-drop area
  - Add validation message container div
  - Add training control section with "Train Neural Core" button (initially disabled)
  - Add training status terminal div for log messages
  - Add prediction input section (initially hidden) with container for dynamic inputs
  - Add prediction output display area
  - Link CSS and JavaScript files
  - _Requirements: 6.1, 6.2, 6.3_

- [x] 5. Implement web interface styling (style.css)





  - [x] 5.1 Apply Frankenstein laboratory theme


    - Set dark background (#0a0a0a) and neon green text (#00ff41)
    - Apply monospace font family to all text
    - Add text-shadow glow effects to key elements
    - _Requirements: 6.4_
  
  - [x] 5.2 Style file upload area


    - Create dashed border drag-drop zone
    - Add hover and drag-over state styles
    - Style file input button
    - _Requirements: 6.1_
  

  - [x] 5.3 Style training status terminal

    - Create scrollable container with fixed height
    - Apply terminal-like styling with padding and border
    - Add CRT scanline effect using pseudo-elements or background
    - _Requirements: 6.3_
  
  - [x] 5.4 Style prediction interface


    - Style dynamic input fields with consistent spacing
    - Create prominent "Predict" button with glow effect
    - Style output display with large font size
    - Add responsive layout for mobile devices
    - _Requirements: 6.4_

- [x] 6. Implement web interface logic (app.js)



  - [x] 6.1 Implement CSV parsing and validation

    - Write parseCSV function that reads file content
    - Validate header row matches pattern "x1,x2,...,xN,y" where 1 ≤ N ≤ 10
    - Parse data rows and convert to float arrays
    - Detect non-numeric values and return error
    - Return structured object with n_inputs, inputs array, outputs array, n_rows
    - _Requirements: 1.1, 1.3, 1.4_
  

  - [x] 6.2 Implement file upload handling
    - Add event listener for file input change
    - Add drag-and-drop event listeners (dragover, drop)
    - Read file using FileReader API
    - Call parseCSV and handle validation result
    - Display error message if validation fails
    - Enable "Train Neural Core" button if validation succeeds
    - Store parsed data in global variable
    - _Requirements: 1.2, 1.5, 6.5_
  
  - [x] 6.3 Implement WASM module initialization

    - Write async initWASM function that loads Module
    - Use cwrap to create JavaScript wrappers for train_ann and run_ann
    - Store references to malloc, free, and HEAPF32
    - Call initWASM on page load
    - _Requirements: 5.4, 5.5_
  
  - [x] 6.4 Implement training execution


    - Add click event listener to "Train Neural Core" button
    - Write trainNetwork async function
    - Allocate WASM memory for inputs and outputs using malloc
    - Copy Float32Array data to WASM heap (HEAPF32)
    - Display training status messages: "[CORE] Reanimation sequence initiated...", "[LEARNING] Synaptic calibration in progress..."
    - Call train_ann function with memory pointers
    - Free allocated WASM memory
    - Display final loss in status terminal
    - Enable prediction interface after training completes
    - _Requirements: 3.2, 3.3_
  

  - [x] 6.5 Implement dynamic prediction input generation
    - Write generatePredictionInputs function that takes n_inputs parameter
    - Clear existing input fields
    - Create n_inputs number input elements labeled x1, x2, ..., xN
    - Append inputs to prediction container
    - Show prediction section
    - _Requirements: 4.1_
  
  - [x] 6.6 Implement prediction execution



    - Add click event listener to "Predict" button
    - Write makePrediction function
    - Collect values from all prediction input fields
    - Validate that all fields have numeric values
    - Allocate WASM memory for input array
    - Copy input values to WASM heap
    - Call run_ann function
    - Free allocated WASM memory
    - Display prediction result (ŷ) with 4 decimal places
    - _Requirements: 4.2, 4.3, 4.4, 4.5_
  

  - [x] 6.7 Implement status message display
    - Write updateStatus function that appends messages to terminal
    - Add timestamp prefix to each message
    - Auto-scroll terminal to bottom on new message
    - Apply different styling for different message types (info, error, success)
    - _Requirements: 3.2, 6.5_

- [x] 7. Create build script and documentation





  - Write build.sh (or build.bat for Windows) with Emscripten compilation command
  - Include all necessary flags: -O3, -msimd128, EXPORTED_FUNCTIONS, MODULARIZE, etc.
  - Write README.md with prerequisites (Emscripten installation)
  - Document build command and usage instructions
  - Document CSV format requirements with examples
  - Add troubleshooting section for common issues
  - _Requirements: 7.2, 7.3_

- [x] 8. Integration and end-to-end testing




  - [x] 8.1 Test complete training workflow


    - Create simple test dataset (e.g., linear relationship: y = 2*x1 + 3*x2)
    - Upload CSV through web interface
    - Verify validation passes
    - Execute training and verify loss decreases
    - Verify training completes without errors
    - _Requirements: 2.4, 3.1, 3.3_
  
  - [x] 8.2 Test prediction workflow


    - After training, enter test input values
    - Execute prediction
    - Verify output is reasonable (matches expected pattern)
    - Test with multiple different inputs
    - _Requirements: 4.2, 4.3, 4.4_
  
  - [x] 8.3 Test error handling


    - Test invalid CSV formats (wrong headers, missing columns)
    - Test non-numeric data in CSV
    - Test prediction before training
    - Test prediction with wrong number of inputs
    - Verify appropriate error messages display
    - _Requirements: 1.2, 6.5_

- [x] 9. Polish and optimization






  - [x] 9.1 Optimize assembly functions

    - Profile dot_product performance
    - Ensure SIMD instructions are being used effectively
    - Test with different vector lengths
    - _Requirements: 5.1, 5.2, 5.3_
  

  - [x] 9.2 Add visual polish to UI

    - Implement pulsing animation for training status
    - Add smooth transitions for showing/hiding sections
    - Test responsive layout on different screen sizes
    - Add loading spinner during WASM initialization
    - _Requirements: 6.4_
  

  - [x] 9.3 Add user experience improvements

    - Add "Clear" button to reset and upload new CSV
    - Add "Download Results" to export predictions
    - Add tooltips explaining network architecture
    - Display network configuration (n_inputs, n_hidden, n_outputs) after training
    - _Requirements: 6.4_
