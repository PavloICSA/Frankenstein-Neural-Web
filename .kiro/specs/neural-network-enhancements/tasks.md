# Implementation Plan

- [x] 1. Implement SIMD activation functions in assembly layer





  - Add ReLU forward pass using `wasm_f32x4_max` for SIMD vectorization
  - Add ReLU backward pass using `wasm_f32x4_gt` for comparison masks
  - Add tanh forward pass using fast polynomial approximation with SIMD
  - Add tanh backward pass using pre-computed tanh outputs
  - Export new functions with `extern` declarations for C layer
  - _Requirements: 1.1, 1.2, 1.3, 3.1, 3.2, 3.3_

- [x] 2. Enhance C orchestration layer for configurable architecture





  - Modify `NeuralNetwork` struct to include `activation_type` field (0=sigmoid, 1=relu, 2=tanh)
  - Create `train_ann_v2` function accepting `n_hidden` (2-20) and `activation_type` parameters
  - Implement activation function dispatcher that calls appropriate SIMD function based on type
  - Implement activation derivative dispatcher for backpropagation
  - Add parameter validation for hidden layer size and activation type ranges
  - Update memory allocation to handle variable hidden layer sizes
  - _Requirements: 1.4, 1.5, 3.1, 3.4, 4.1, 4.2, 4.3, 4.4_

- [x] 3. Add loss tracking and weight extraction functions





  - Modify training loop to populate `loss_history` array passed from JavaScript
  - Create `get_weights` function to extract weight matrices for visualization
  - Add `EMSCRIPTEN_KEEPALIVE` macros to new exported functions
  - Update error handling to return specific error codes for validation failures
  - _Requirements: 1.6, 5.1, 5.2, 7.4, 7.5_

- [x] 4. Create pre-loaded datasets in JavaScript





  - Define `PRELOADED_DATASETS` object with XOR, linear regression, and Iris datasets
  - Implement Iris dataset with 50 samples (4 features, binary classification)
  - Create normalization function for Iris features to [0,1] range
  - Store feature names and dataset metadata for UI display
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 6.1, 6.2, 6.4_

- [x] 5. Build dataset selector UI





  - Add dropdown menu with dataset options (XOR, Linear Regression, Iris)
  - Add "Load Dataset" button to populate training interface
  - Display dataset information (rows, features, description) when selected
  - Implement dataset loading function that populates `parsedData` object
  - Allow switching between pre-loaded datasets and CSV uploads
  - _Requirements: 2.1, 2.4, 2.5, 6.4_


- [x] 6. Create network configuration UI controls





  - Add activation function selector dropdown (Sigmoid, ReLU, Tanh)
  - Add hidden layer size slider (range 2-20, default 6)
  - Display current slider value dynamically as user adjusts
  - Update training function to pass configuration parameters to WASM
  - Display selected configuration in network architecture summary after training
  - _Requirements: 3.4, 3.5, 4.1, 4.5, 4.6_

- [x] 7. Implement LossGraph class with Canvas API





  - Create `LossGraph` class with canvas initialization and context setup
  - Implement `addDataPoint(epoch, loss)` method to append loss values
  - Implement `render()` method to draw axes, grid lines, and loss curve
  - Use neon green (#00ff41) for loss curve to match Frankenstein theme
  - Implement `clear()` method to reset graph for new training sessions
  - Add axis labels (Epoch, Loss) and scale markers
  - _Requirements: 5.1, 5.3, 5.4_

- [x] 8. Integrate real-time loss visualization with training





  - Allocate loss history array in JavaScript before training
  - Pass loss history pointer to `train_ann_v2` WASM function
  - Create LossGraph instance and clear previous data when training starts
  - Update loss graph after training completes with all epoch data
  - Display final loss value numerically alongside graph
  - _Requirements: 5.2, 5.4, 5.5_

- [x] 9. Implement WeightHeatmap class with Canvas API





  - Create `WeightHeatmap` class with canvas initialization
  - Implement `render(weights, rows, cols, title)` method for heatmap drawing
  - Implement `weightToColor(weight, absMax)` for blue-white-red gradient mapping
  - Draw weight matrix as colored rectangles with borders
  - Add title and color scale legend to heatmap
  - Calculate cell sizes dynamically based on canvas dimensions
  - _Requirements: 7.1, 7.2, 7.3_

- [x] 10. Integrate weight visualization after training






  - Call `get_weights` WASM function after training completes
  - Allocate memory for weight matrices and copy from WASM heap
  - Create WeightHeatmap instances for input-to-hidden and hidden-to-output weights
  - Render both heatmaps with appropriate dimensions and titles
  - Update visualizations within 200ms of training completion
  - _Requirements: 7.1, 7.5_


- [x] 11. Add hover tooltips to weight heatmaps





  - Implement `setupHoverTooltip(weights, rows, cols)` method in WeightHeatmap class
  - Add mousemove event listener to canvas for hover detection
  - Calculate cell position from mouse coordinates
  - Display exact weight value in tooltip at cursor position
  - Style tooltip to match Frankenstein theme
  - _Requirements: 7.4_

- [x] 12. Update build system for new exports





  - Add `_train_ann_v2` to EXPORTED_FUNCTIONS in build.sh
  - Add `_get_weights` to EXPORTED_FUNCTIONS in build.sh
  - Update build.bat with same exported functions for Windows
  - Verify `-msimd128` flag is present for SIMD support
  - Test build process produces valid neurobrain.js and neurobrain.wasm
  - _Requirements: 1.6_

- [x] 13. Add Iris dataset validation and accuracy display





  - Implement accuracy calculation for Iris binary classification
  - Display accuracy percentage after training completes
  - Verify accuracy meets 90% threshold requirement
  - Add validation to ensure Iris predictions use normalized inputs
  - _Requirements: 6.3, 6.5_

- [x] 14. Update UI styling for new components





  - Add CSS for dataset selector dropdown and load button
  - Add CSS for activation function selector
  - Add CSS for hidden layer size slider with value display
  - Add CSS for loss graph canvas container
  - Add CSS for weight heatmap canvas containers (side-by-side layout)
  - Ensure all new elements match Frankenstein theme (dark background, neon green)
  - _Requirements: 2.1, 3.4, 4.1, 5.1, 7.1_

- [x] 15. Implement backward compatibility layer





  - Keep original `train_ann` function unchanged in C layer
  - Add feature detection in JavaScript to check for `train_ann_v2` availability
  - Fallback to `train_ann` if v2 not available
  - Ensure existing CSV upload workflow continues to work
  - Test that old functionality works without new features enabled
  - _Requirements: 1.1, 1.4_


- [ ]* 16. Create unit tests for SIMD functions
  - Write test cases for ReLU forward pass (positive, negative, zero inputs)
  - Write test cases for ReLU backward pass (derivative validation)
  - Write test cases for tanh forward pass (output range and boundary behavior)
  - Write test cases for tanh backward pass (derivative calculation)
  - Compare SIMD results with scalar reference implementations
  - Test edge cases (empty arrays, single elements, non-aligned lengths)
  - _Requirements: 1.1, 1.2, 1.3, 3.1, 3.2, 3.3_

- [ ]* 17. Create integration tests for training flow
  - Test end-to-end training with XOR dataset and ReLU activation
  - Test training with different hidden layer sizes (2, 6, 10, 20)
  - Test training with all three activation functions (sigmoid, ReLU, tanh)
  - Verify loss decreases over epochs for all configurations
  - Verify weight matrices have correct dimensions after training
  - Test prediction accuracy on Iris dataset meets 90% threshold
  - _Requirements: 1.4, 3.4, 4.3, 6.5_

- [ ]* 18. Create performance tests
  - Measure SIMD execution time vs scalar implementations
  - Verify SIMD provides speedup for vector operations
  - Measure training time for different hidden layer sizes
  - Measure Canvas rendering time for loss graph (verify <100ms)
  - Measure weight heatmap rendering time (verify <200ms)
  - Test memory usage doesn't grow unexpectedly during training
  - _Requirements: 1.1, 5.2, 7.5_

- [ ]* 19. Test browser compatibility
  - Verify WASM SIMD support in Chrome 91+
  - Verify WASM SIMD support in Firefox 89+
  - Verify WASM SIMD support in Safari 16.4+
  - Test Canvas rendering on different screen sizes
  - Test hover tooltips work on touch devices
  - Display warning message for unsupported browsers
  - _Requirements: 1.6_

- [ ]* 20. Create documentation for new features
  - Document activation function options and use cases
  - Document hidden layer size configuration guidelines
  - Document pre-loaded datasets and their characteristics
  - Add examples of loss graph interpretation
  - Add examples of weight heatmap interpretation
  - Update README with new feature descriptions
  - _Requirements: 2.1, 3.4, 4.1, 5.1, 7.1_
