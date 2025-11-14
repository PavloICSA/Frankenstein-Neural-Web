# Requirements Document

## Introduction

This document specifies requirements for enhancing the Frankenstein Neural Web application with additional network architectures, pre-loaded datasets, and real-time training visualizations. These enhancements will improve user experience by providing immediate experimentation capabilities, flexible network configurations, and visual feedback during training.

## Glossary

- **Neural Network System**: The Frankenstein Neural Web application consisting of WebAssembly SIMD computation core, C orchestration layer, and JavaScript web interface
- **Activation Function**: Mathematical function applied to neuron outputs (sigmoid, ReLU, tanh)
- **Hidden Layer**: The intermediate layer of neurons between input and output layers
- **Training Loss**: Numerical measure of prediction error during network training
- **Pre-loaded Dataset**: Built-in example dataset available without user upload
- **SIMD**: Single Instruction Multiple Data - parallel computation instructions in WebAssembly
- **Epoch**: One complete pass through the training dataset

## Requirements

### Requirement 1: Core Computation Performance

**User Story:** As a developer, I want all performance-critical neural network computations to remain in WebAssembly SIMD assembly, so that the system maintains optimal performance.

#### Acceptance Criteria

1. THE Neural Network System SHALL implement all activation functions (sigmoid, ReLU, tanh) using WebAssembly SIMD intrinsics in src/asm/ann_simd.c
2. THE Neural Network System SHALL implement all dot product operations using SIMD vector instructions for parallel computation
3. THE Neural Network System SHALL implement all weight update operations using SIMD vector instructions for parallel computation
4. THE Neural Network System SHALL implement all matrix-vector multiplications using SIMD intrinsics regardless of hidden layer size
5. THE Neural Network System SHALL NOT perform any neural network mathematical operations in JavaScript except for data preparation and result formatting
6. WHEN compiling with Emscripten, THE Neural Network System SHALL use the -msimd128 flag to enable SIMD instructions

### Requirement 2: Pre-loaded Example Datasets

**User Story:** As a user, I want to access pre-loaded example datasets, so that I can immediately experiment with the neural network without preparing my own data.

#### Acceptance Criteria

1. WHEN the Neural Network System loads, THE Neural Network System SHALL display a dataset selector with at least three pre-loaded options
2. WHERE the user selects the XOR dataset option, THE Neural Network System SHALL load a 2-input XOR problem dataset with 4 training examples
3. WHERE the user selects a regression dataset option, THE Neural Network System SHALL load a simple regression problem with 1 input feature and continuous output values
4. WHEN the user selects a pre-loaded dataset, THE Neural Network System SHALL populate the training interface with the dataset and display the number of features and examples
5. THE Neural Network System SHALL allow users to switch between pre-loaded datasets and custom CSV uploads without page reload

### Requirement 3: ReLU Activation Function

**User Story:** As a user, I want to use ReLU activation functions, so that I can train networks with different learning characteristics and compare performance.

#### Acceptance Criteria

1. THE Neural Network System SHALL implement ReLU activation function using WebAssembly SIMD intrinsics in the assembly layer (src/asm/)
2. THE Neural Network System SHALL implement ReLU forward pass computation (max(0, x)) using SIMD vector operations for parallel processing
3. THE Neural Network System SHALL implement ReLU backward pass derivative (1 if x > 0, else 0) using SIMD vector operations for parallel processing
4. WHEN the user selects ReLU activation, THE Neural Network System SHALL call the SIMD ReLU functions from the C orchestration layer
5. THE Neural Network System SHALL provide a UI selector allowing users to choose between sigmoid and ReLU activation functions before training
6. WHEN training completes, THE Neural Network System SHALL display which activation function was used in the results summary

### Requirement 4: Configurable Hidden Layer Size

**User Story:** As a user, I want to configure the number of hidden layer neurons, so that I can experiment with different network capacities for my problem.

#### Acceptance Criteria

1. THE Neural Network System SHALL provide a UI control allowing users to select hidden layer size between 2 and 20 neurons
2. WHEN the user changes the hidden layer size, THE Neural Network System SHALL pass the configuration to the C orchestration layer before training begins
3. THE Neural Network System SHALL allocate appropriate memory in WebAssembly for weight matrices based on the selected hidden layer size
4. THE Neural Network System SHALL perform all matrix operations for the configurable hidden layer using SIMD intrinsics in the assembly layer
5. WHEN training completes, THE Neural Network System SHALL display the hidden layer size used in the network architecture summary
6. THE Neural Network System SHALL validate that hidden layer size is within acceptable range and display an error message if invalid

### Requirement 5: Real-time Training Loss Visualization

**User Story:** As a user, I want to see a real-time graph of training loss, so that I can monitor how well the network is learning during training.

#### Acceptance Criteria

1. THE Neural Network System SHALL display a line graph showing training loss on the y-axis and epoch number on the x-axis
2. WHEN each training epoch completes, THE Neural Network System SHALL update the loss graph with the new loss value within 100 milliseconds
3. THE Neural Network System SHALL render the loss graph using HTML5 Canvas API without external charting libraries
4. WHEN training begins, THE Neural Network System SHALL clear any previous loss graph data
5. THE Neural Network System SHALL display the final loss value numerically alongside the graph when training completes

### Requirement 6: Iris Dataset Support

**User Story:** As a user, I want to train on the classic Iris dataset, so that I can test the network on a well-known classification problem.

#### Acceptance Criteria

1. WHERE the user selects the Iris dataset option, THE Neural Network System SHALL load the Iris dataset with 4 input features (sepal length, sepal width, petal length, petal width)
2. THE Neural Network System SHALL normalize Iris dataset features to the range [0, 1] before training
3. THE Neural Network System SHALL provide binary classification output (1 for Iris-setosa, 0 for other species) for the Iris dataset
4. WHEN the Iris dataset is loaded, THE Neural Network System SHALL display feature names and dataset statistics (number of examples, feature ranges)
5. THE Neural Network System SHALL achieve at least 90% accuracy on Iris-setosa classification after training

### Requirement 7: Weight Visualization

**User Story:** As a user, I want to visualize network weights as a heatmap, so that I can understand how the network represents learned patterns.

#### Acceptance Criteria

1. WHEN training completes, THE Neural Network System SHALL display weight matrices as color-coded heatmaps
2. THE Neural Network System SHALL render separate heatmaps for input-to-hidden weights and hidden-to-output weights
3. THE Neural Network System SHALL use a color gradient from blue (negative weights) through white (zero) to red (positive weights)
4. WHEN the user hovers over a weight cell in the heatmap, THE Neural Network System SHALL display the exact numerical weight value
5. THE Neural Network System SHALL update weight visualizations within 200 milliseconds after training completes
