#include <emscripten.h>
#include <stdlib.h>
#include <math.h>
#include <string.h>

// Assembly function declarations
extern float dot_product(float* vec1, float* vec2, int length);
extern float sigmoid(float x);
extern float sigmoid_derivative(float sigmoid_out);
extern void update_weights(float* weights, float* gradients, float lr, int length);

// New SIMD activation functions
extern void relu_forward_simd(float* input, float* output, int length);
extern void relu_backward_simd(float* input, float* grad_output, float* grad_input, int length);
extern void tanh_forward_simd(float* input, float* output, int length);
extern void tanh_backward_simd(float* output, float* grad_output, float* grad_input, int length);

// Neural Network structure
typedef struct {
    int n_inputs;        // 1-10
    int n_hidden;        // 2-20 (configurable)
    int n_outputs;       // Always 1
    
    float* weights_ih;   // Input to hidden: [n_inputs * n_hidden]
    float* weights_ho;   // Hidden to output: [n_hidden * n_outputs]
    float* bias_h;       // Hidden biases: [n_hidden]
    float* bias_o;       // Output bias: [n_outputs]
    
    float* hidden_activations;  // Temporary storage
    float* output_activation;   // Temporary storage
    
    int activation_type;  // 0=sigmoid, 1=relu, 2=tanh
    int is_initialized;  // Flag to check if network is trained
} NeuralNetwork;

// Global network instance
static NeuralNetwork network = {0};

// Simple random number generator for weight initialization
static unsigned int seed = 12345;

static float rand_float() {
    seed = seed * 1103515245 + 12345;
    return ((seed / 65536) % 32768) / 32768.0f;
}

// Xavier/Glorot initialization: uniform distribution in [-limit, limit]
static float xavier_init(int n_in, int n_out) {
    float limit = sqrtf(6.0f / (n_in + n_out));
    return (rand_float() * 2.0f - 1.0f) * limit;
}

// Initialize network with given dimensions and activation type
static void init_network(int n_inputs, int n_hidden, int n_outputs, int activation_type) {
    // Free existing memory if network was previously initialized
    if (network.is_initialized) {
        free(network.weights_ih);
        free(network.weights_ho);
        free(network.bias_h);
        free(network.bias_o);
        free(network.hidden_activations);
        free(network.output_activation);
    }
    
    // Set dimensions
    network.n_inputs = n_inputs;
    network.n_hidden = n_hidden;
    network.n_outputs = n_outputs;
    network.activation_type = activation_type;
    
    // Allocate memory for weights and biases
    network.weights_ih = (float*)malloc(n_inputs * n_hidden * sizeof(float));
    network.weights_ho = (float*)malloc(n_hidden * n_outputs * sizeof(float));
    network.bias_h = (float*)malloc(n_hidden * sizeof(float));
    network.bias_o = (float*)malloc(n_outputs * sizeof(float));
    
    // Allocate temporary activation buffers
    network.hidden_activations = (float*)malloc(n_hidden * sizeof(float));
    network.output_activation = (float*)malloc(n_outputs * sizeof(float));
    
    // Initialize input-to-hidden weights using Xavier initialization
    for (int i = 0; i < n_inputs * n_hidden; i++) {
        network.weights_ih[i] = xavier_init(n_inputs, n_hidden);
    }
    
    // Initialize hidden-to-output weights using Xavier initialization
    for (int i = 0; i < n_hidden * n_outputs; i++) {
        network.weights_ho[i] = xavier_init(n_hidden, n_outputs);
    }
    
    // Initialize biases to zero
    memset(network.bias_h, 0, n_hidden * sizeof(float));
    memset(network.bias_o, 0, n_outputs * sizeof(float));
    
    network.is_initialized = 1;
}

// Activation function dispatcher for forward pass
static void apply_activation(float* input, float* output, int length, int activation_type) {
    switch (activation_type) {
        case 0: // Sigmoid
            for (int i = 0; i < length; i++) {
                output[i] = sigmoid(input[i]);
            }
            break;
        case 1: // ReLU
            relu_forward_simd(input, output, length);
            break;
        case 2: // Tanh
            tanh_forward_simd(input, output, length);
            break;
        default:
            // Default to sigmoid if invalid type
            for (int i = 0; i < length; i++) {
                output[i] = sigmoid(input[i]);
            }
            break;
    }
}

// Activation derivative dispatcher for backward pass
static float apply_activation_derivative(float activation_output, int activation_type) {
    switch (activation_type) {
        case 0: // Sigmoid
            return sigmoid_derivative(activation_output);
        case 1: // ReLU
            return (activation_output > 0.0f) ? 1.0f : 0.0f;
        case 2: // Tanh
            return 1.0f - activation_output * activation_output;
        default:
            return sigmoid_derivative(activation_output);
    }
}

// Forward propagation: compute network output for given input
static void compute_forward_pass(float* input) {
    // Temporary buffer for pre-activation values
    float* z_h = (float*)malloc(network.n_hidden * sizeof(float));
    
    // Input to hidden layer
    for (int h = 0; h < network.n_hidden; h++) {
        // Get weights for this hidden neuron
        float* weights_slice = &network.weights_ih[h * network.n_inputs];
        
        // Compute weighted sum using assembly dot product
        z_h[h] = dot_product(input, weights_slice, network.n_inputs);
        z_h[h] += network.bias_h[h];
    }
    
    // Apply activation function to hidden layer
    apply_activation(z_h, network.hidden_activations, network.n_hidden, network.activation_type);
    
    free(z_h);
    
    // Hidden to output layer
    for (int o = 0; o < network.n_outputs; o++) {
        // Compute weighted sum using assembly dot product
        float z_o = dot_product(network.hidden_activations, network.weights_ho, network.n_hidden);
        z_o += network.bias_o[o];
        
        // Apply sigmoid activation (output layer always uses sigmoid)
        network.output_activation[o] = sigmoid(z_o);
    }
}

// Backward propagation: compute gradients and update weights
static void compute_backward_pass(float* input, float target, float learning_rate) {
    // Allocate temporary arrays for deltas
    float* delta_h = (float*)malloc(network.n_hidden * sizeof(float));
    float delta_o;
    
    // Compute output layer delta (output always uses sigmoid)
    float error = network.output_activation[0] - target;
    delta_o = error * sigmoid_derivative(network.output_activation[0]);
    
    // Compute hidden layer deltas using activation derivative dispatcher
    for (int h = 0; h < network.n_hidden; h++) {
        float error_h = delta_o * network.weights_ho[h];
        delta_h[h] = error_h * apply_activation_derivative(network.hidden_activations[h], network.activation_type);
    }
    
    // Update hidden-to-output weights
    for (int h = 0; h < network.n_hidden; h++) {
        network.weights_ho[h] -= learning_rate * delta_o * network.hidden_activations[h];
    }
    network.bias_o[0] -= learning_rate * delta_o;
    
    // Update input-to-hidden weights
    for (int h = 0; h < network.n_hidden; h++) {
        for (int i = 0; i < network.n_inputs; i++) {
            network.weights_ih[h * network.n_inputs + i] -= learning_rate * delta_h[h] * input[i];
        }
        network.bias_h[h] -= learning_rate * delta_h[h];
    }
    
    free(delta_h);
}

// Exported training function (backward compatible)
EMSCRIPTEN_KEEPALIVE
float train_ann(float* inputs, float* outputs, int n_rows, int n_inputs) {
    // Initialize network with fixed hidden layer size and sigmoid activation
    int n_hidden = 6;
    int n_outputs = 1;
    int activation_type = 0; // Sigmoid for backward compatibility
    init_network(n_inputs, n_hidden, n_outputs, activation_type);
    
    // Training hyperparameters
    float learning_rate = 0.01f;
    int epochs = 300;
    
    float final_loss = 0.0f;
    
    // Training loop
    for (int epoch = 0; epoch < epochs; epoch++) {
        float total_loss = 0.0f;
        
        // Iterate through all training samples
        for (int row = 0; row < n_rows; row++) {
            // Get input for this row
            float* input_row = &inputs[row * n_inputs];
            float target = outputs[row];
            
            // Forward pass
            compute_forward_pass(input_row);
            
            // Compute error and loss
            float error = network.output_activation[0] - target;
            total_loss += error * error;
            
            // Backward pass and weight update
            compute_backward_pass(input_row, target, learning_rate);
        }
        
        // Compute average loss for this epoch
        final_loss = total_loss / n_rows;
        
        // Early stopping if loss is very small
        if (final_loss < 0.001f) {
            break;
        }
    }
    
    return final_loss;
}

// Exported training function v2 with configurable architecture
EMSCRIPTEN_KEEPALIVE
float train_ann_v2(float* inputs, float* outputs, int n_rows, int n_inputs, 
                   int n_hidden, int activation_type, float* loss_history) {
    // Parameter validation
    if (n_inputs < 1 || n_inputs > 10) {
        return -1.0f; // Error: invalid input size
    }
    if (n_hidden < 2 || n_hidden > 20) {
        return -2.0f; // Error: invalid hidden layer size
    }
    if (activation_type < 0 || activation_type > 2) {
        return -3.0f; // Error: invalid activation type
    }
    if (n_rows < 1) {
        return -4.0f; // Error: invalid number of rows
    }
    
    // Initialize network with configurable parameters
    int n_outputs = 1;
    init_network(n_inputs, n_hidden, n_outputs, activation_type);
    
    // Training hyperparameters
    float learning_rate = 0.01f;
    int epochs = 300;
    
    float final_loss = 0.0f;
    
    // Training loop
    for (int epoch = 0; epoch < epochs; epoch++) {
        float total_loss = 0.0f;
        
        // Iterate through all training samples
        for (int row = 0; row < n_rows; row++) {
            // Get input for this row
            float* input_row = &inputs[row * n_inputs];
            float target = outputs[row];
            
            // Forward pass
            compute_forward_pass(input_row);
            
            // Compute error and loss
            float error = network.output_activation[0] - target;
            total_loss += error * error;
            
            // Backward pass and weight update
            compute_backward_pass(input_row, target, learning_rate);
        }
        
        // Compute average loss for this epoch
        final_loss = total_loss / n_rows;
        
        // Store loss history if provided
        if (loss_history != NULL) {
            loss_history[epoch] = final_loss;
        }
        
        // Early stopping if loss is very small
        if (final_loss < 0.001f) {
            // Fill remaining epochs with final loss
            if (loss_history != NULL) {
                for (int e = epoch + 1; e < epochs; e++) {
                    loss_history[e] = final_loss;
                }
            }
            break;
        }
    }
    
    return final_loss;
}

// Exported prediction function
EMSCRIPTEN_KEEPALIVE
float run_ann(float* input, int n_inputs) {
    // Validate that network is trained
    if (!network.is_initialized) {
        return -1.0f; // Error: network not trained
    }
    
    // Validate input dimensions
    if (n_inputs != network.n_inputs) {
        return -1.0f; // Error: dimension mismatch
    }
    
    // Compute forward pass
    compute_forward_pass(input);
    
    // Return output activation
    return network.output_activation[0];
}

// Exported weight extraction function
EMSCRIPTEN_KEEPALIVE
void get_weights(float* weights_ih_out, float* weights_ho_out) {
    // Validate that network is initialized
    if (!network.is_initialized) {
        return;
    }
    
    // Copy input-to-hidden weights
    if (weights_ih_out != NULL) {
        memcpy(weights_ih_out, network.weights_ih, 
               network.n_inputs * network.n_hidden * sizeof(float));
    }
    
    // Copy hidden-to-output weights
    if (weights_ho_out != NULL) {
        memcpy(weights_ho_out, network.weights_ho, 
               network.n_hidden * network.n_outputs * sizeof(float));
    }
}
