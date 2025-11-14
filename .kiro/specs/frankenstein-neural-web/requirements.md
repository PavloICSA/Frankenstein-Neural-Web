# Requirements Document

## Introduction

The Frankenstein Neural Web is a fully functional artificial neural network system implemented in x86-64 assembly and C, compiled to WebAssembly (WASM), and controllable through a web interface. The system performs real gradient descent training on user-provided CSV data, supporting 1-10 input features and a single output, with the ability to make predictions on new data after training.

## Glossary

- **ANN Core**: The artificial neural network computation engine implemented in assembly and C
- **Training Module**: The component responsible for executing gradient descent and weight updates
- **CSV Parser**: The frontend component that validates and parses comma-separated value files
- **Prediction Engine**: The trained ANN component that computes forward propagation for new inputs
- **WASM Bridge**: The interface layer between JavaScript and compiled WebAssembly code
- **Web Interface**: The HTML/CSS/JS frontend that provides user interaction
- **Epoch**: A single complete pass through the entire training dataset
- **Learning Rate**: The scalar multiplier applied to weight updates during training
- **Forward Propagation**: The process of computing network output from inputs through weighted connections
- **Backward Propagation**: The process of computing gradients and updating weights based on error

## Requirements

### Requirement 1

**User Story:** As a data scientist, I want to upload CSV files with labeled training data, so that I can train a neural network on my custom datasets

#### Acceptance Criteria

1.1 WHEN the user selects a CSV file, THE CSV Parser SHALL validate that the first row contains headers matching the pattern "x1,x2,...,xN,y" where N is between 1 and 10

1.2 IF the CSV file does not match the required header pattern, THEN THE Web Interface SHALL display the message "⚠️ Invalid CSV structure. Please format columns as x1,x2,…,xN,y."

1.3 WHEN the CSV file passes validation, THE CSV Parser SHALL convert all data rows into float arrays with precision of at least 32 bits

1.4 THE CSV Parser SHALL reject files where any data cell contains non-numeric values

1.5 WHEN CSV validation succeeds, THE Web Interface SHALL enable the "Train Neural Core" button

### Requirement 2

**User Story:** As a machine learning practitioner, I want the neural network to perform real mathematical training, so that the model learns actual patterns from data rather than producing mock results

#### Acceptance Criteria

2.1 THE ANN Core SHALL implement a three-layer architecture consisting of an input layer with 1 to 10 neurons, a hidden layer with 4 to 8 neurons, and an output layer with 1 neuron

2.2 THE Training Module SHALL execute forward propagation by computing dot products between input vectors and weight matrices followed by activation function application

2.3 THE Training Module SHALL use sigmoid activation function or ReLU activation function for all neurons

2.4 THE Training Module SHALL compute prediction error as the difference between predicted output and actual output for each training example

2.5 THE Training Module SHALL execute backward propagation by computing gradients of the error with respect to each weight

2.6 THE Training Module SHALL update all weights using the computed gradients multiplied by the learning rate

### Requirement 3

**User Story:** As a user, I want to configure and monitor the training process, so that I can understand how the network is learning

#### Acceptance Criteria

3.1 WHEN the user clicks "Train Neural Core", THE Training Module SHALL execute between 100 and 500 training epochs

3.2 WHILE training is in progress, THE Web Interface SHALL display status messages including "[CORE] Reanimation sequence initiated", "[LEARNING] Synaptic calibration in progress", and "[STATUS] Training epochs completed: X/500"

3.3 WHEN training completes, THE Web Interface SHALL display the final training loss value

3.4 THE Training Module SHALL accept a learning rate parameter with a default value between 0.001 and 0.1

3.5 THE ANN Core SHALL perform all mathematical operations using native computation without randomized or mocked values

### Requirement 4

**User Story:** As a user, I want to make predictions on new data after training, so that I can use the trained model for inference

#### Acceptance Criteria

4.1 WHEN training completes successfully, THE Web Interface SHALL generate input fields dynamically matching the number of features (x1 through xN) from the training data

4.2 WHEN the user enters values into all prediction input fields and clicks "Predict", THE Prediction Engine SHALL execute forward propagation using the trained weights

4.3 THE Prediction Engine SHALL compute and return a single numeric output value (ŷ) with precision matching the training data

4.4 WHEN prediction completes, THE Web Interface SHALL display the predicted output value to the user in real time

4.5 THE Prediction Engine SHALL accept input arrays with length matching the number of features used during training

### Requirement 5

**User Story:** As a developer, I want the neural network core implemented in assembly and C compiled to WASM, so that the system achieves high performance and runs in web browsers

#### Acceptance Criteria

5.1 THE ANN Core SHALL implement dot product computation in x86-64 assembly language

5.2 THE ANN Core SHALL implement activation functions in x86-64 assembly language

5.3 THE ANN Core SHALL implement weight update operations in x86-64 assembly language

5.4 THE WASM Bridge SHALL expose a function "train_ann" that accepts float arrays for inputs, outputs, row count, and input count

5.5 THE WASM Bridge SHALL expose a function "run_ann" that accepts a float array for new inputs and input count, returning a single float prediction

5.6 THE ANN Core SHALL compile to WebAssembly using Emscripten with optimization level O3

### Requirement 6

**User Story:** As a user, I want an intuitive and visually engaging interface, so that interacting with the neural network feels immersive and clear

#### Acceptance Criteria

6.1 THE Web Interface SHALL provide a file upload area for CSV file selection

6.2 THE Web Interface SHALL display validation messages in a dedicated container element

6.3 THE Web Interface SHALL provide a training progress indicator showing epoch count or completion percentage

6.4 THE Web Interface SHALL apply a dark terminal aesthetic with neon green or amber text on black background

6.5 WHEN any error occurs during CSV parsing, training, or prediction, THE Web Interface SHALL display a descriptive error message to the user

### Requirement 7

**User Story:** As a developer, I want clear build instructions and modular code structure, so that the project is maintainable and extensible

#### Acceptance Criteria

7.1 THE project SHALL organize source code into separate directories for assembly (/src/asm), C code (/src/c), and web files (/src/web)

7.2 THE project SHALL provide a build script or command that compiles assembly and C code to WASM using Emscripten

7.3 THE project SHALL include a README file documenting build requirements, compilation commands, and usage instructions

7.4 THE ANN Core SHALL implement modular functions for dot products, activations, error computation, and weight updates

7.5 THE project SHALL include at least one sample CSV file demonstrating the correct data format
