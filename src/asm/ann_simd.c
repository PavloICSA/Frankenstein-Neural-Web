// WebAssembly SIMD implementation of neural network core functions
// This replaces x86-64 assembly with WebAssembly SIMD intrinsics
// Provides low-level optimized operations for neural network computations

#include <wasm_simd128.h>
#include <math.h>

// ============================================================================
// dot_product: Compute dot product of two float vectors using WASM SIMD
// Parameters:
//   vec1 = first vector pointer
//   vec2 = second vector pointer
//   length = number of elements
// Returns:
//   dot product result (float)
// Optimizations:
//   - Loop unrolling for better instruction-level parallelism
//   - Multiple accumulators to reduce dependency chains
//   - Efficient horizontal sum using pairwise additions
// ============================================================================
float dot_product(float* vec1, float* vec2, int length) {
    // Early exit for small vectors
    if (length == 0) return 0.0f;
    if (length == 1) return vec1[0] * vec2[0];
    
    v128_t sum_vec1 = wasm_f32x4_splat(0.0f);
    v128_t sum_vec2 = wasm_f32x4_splat(0.0f);
    int i = 0;
    
    // Process 8 floats at a time using two accumulators (loop unrolling)
    int simd_length = length & ~7;  // Round down to multiple of 8
    for (i = 0; i < simd_length; i += 8) {
        v128_t v1a = wasm_v128_load(&vec1[i]);
        v128_t v2a = wasm_v128_load(&vec2[i]);
        v128_t v1b = wasm_v128_load(&vec1[i + 4]);
        v128_t v2b = wasm_v128_load(&vec2[i + 4]);
        
        sum_vec1 = wasm_f32x4_add(sum_vec1, wasm_f32x4_mul(v1a, v2a));
        sum_vec2 = wasm_f32x4_add(sum_vec2, wasm_f32x4_mul(v1b, v2b));
    }
    
    // Combine accumulators
    v128_t sum_vec = wasm_f32x4_add(sum_vec1, sum_vec2);
    
    // Process remaining 4-element chunks
    int simd_length4 = length & ~3;
    for (; i < simd_length4; i += 4) {
        v128_t v1 = wasm_v128_load(&vec1[i]);
        v128_t v2 = wasm_v128_load(&vec2[i]);
        sum_vec = wasm_f32x4_add(sum_vec, wasm_f32x4_mul(v1, v2));
    }
    
    // Efficient horizontal sum using pairwise additions
    float sum = wasm_f32x4_extract_lane(sum_vec, 0) +
                wasm_f32x4_extract_lane(sum_vec, 1) +
                wasm_f32x4_extract_lane(sum_vec, 2) +
                wasm_f32x4_extract_lane(sum_vec, 3);
    
    // Process remaining elements (scalar)
    for (; i < length; i++) {
        sum += vec1[i] * vec2[i];
    }
    
    return sum;
}

// ============================================================================
// sigmoid: Apply sigmoid activation function
// Formula: 1 / (1 + e^(-x))
// Uses optimized approximation for performance
// Parameters:
//   x = input value
// Returns:
//   sigmoid(x)
// Optimizations:
//   - Clamping to prevent overflow/underflow
//   - Fast path for extreme values
//   - Efficient computation using native exp
// ============================================================================
float sigmoid(float x) {
    // Fast paths for extreme values
    if (x < -10.0f) return 0.0f;
    if (x > 10.0f) return 1.0f;
    
    // Standard sigmoid computation with optimized exp
    float exp_neg_x = expf(-x);
    return 1.0f / (1.0f + exp_neg_x);
}

// ============================================================================
// sigmoid_derivative: Compute derivative of sigmoid
// Formula: sigmoid(x) * (1 - sigmoid(x))
// Parameters:
//   sigmoid_out = sigmoid output value (already computed)
// Returns:
//   derivative value
// ============================================================================
float sigmoid_derivative(float sigmoid_out) {
    return sigmoid_out * (1.0f - sigmoid_out);
}

// ============================================================================
// relu_forward_simd: Apply ReLU activation using WASM SIMD
// Formula: max(0, x)
// Parameters:
//   input = input vector pointer
//   output = output vector pointer
//   length = number of elements
// Returns:
//   void (writes to output)
// Optimizations:
//   - Loop unrolling for 8 elements at a time
//   - SIMD max operation for parallel processing
// ============================================================================
void relu_forward_simd(float* input, float* output, int length) {
    if (length == 0) return;
    
    v128_t zero = wasm_f32x4_splat(0.0f);
    int i = 0;
    
    // Process 8 floats at a time using SIMD (loop unrolling)
    int simd_length = length & ~7;  // Round down to multiple of 8
    for (i = 0; i < simd_length; i += 8) {
        v128_t input_vec1 = wasm_v128_load(&input[i]);
        v128_t input_vec2 = wasm_v128_load(&input[i + 4]);
        
        v128_t output_vec1 = wasm_f32x4_max(input_vec1, zero);
        v128_t output_vec2 = wasm_f32x4_max(input_vec2, zero);
        
        wasm_v128_store(&output[i], output_vec1);
        wasm_v128_store(&output[i + 4], output_vec2);
    }
    
    // Process remaining 4-element chunks
    int simd_length4 = length & ~3;
    for (; i < simd_length4; i += 4) {
        v128_t input_vec = wasm_v128_load(&input[i]);
        v128_t output_vec = wasm_f32x4_max(input_vec, zero);
        wasm_v128_store(&output[i], output_vec);
    }
    
    // Process remaining elements (scalar)
    for (; i < length; i++) {
        output[i] = (input[i] > 0.0f) ? input[i] : 0.0f;
    }
}

// ============================================================================
// relu_backward_simd: Compute ReLU derivative using WASM SIMD
// Formula: 1 if x > 0, else 0
// Parameters:
//   input = original input vector pointer
//   grad_output = gradient from next layer
//   grad_input = gradient to propagate (output)
//   length = number of elements
// Returns:
//   void (writes to grad_input)
// Optimizations:
//   - SIMD comparison and masking operations
//   - Loop unrolling for 8 elements at a time
// ============================================================================
void relu_backward_simd(float* input, float* grad_output, float* grad_input, int length) {
    if (length == 0) return;
    
    v128_t zero = wasm_f32x4_splat(0.0f);
    int i = 0;
    
    // Process 8 floats at a time using SIMD (loop unrolling)
    int simd_length = length & ~7;  // Round down to multiple of 8
    for (i = 0; i < simd_length; i += 8) {
        v128_t input_vec1 = wasm_v128_load(&input[i]);
        v128_t input_vec2 = wasm_v128_load(&input[i + 4]);
        v128_t grad_out1 = wasm_v128_load(&grad_output[i]);
        v128_t grad_out2 = wasm_v128_load(&grad_output[i + 4]);
        
        // Create mask: 1 if input > 0, else 0
        v128_t mask1 = wasm_f32x4_gt(input_vec1, zero);
        v128_t mask2 = wasm_f32x4_gt(input_vec2, zero);
        
        // Apply mask to gradient
        v128_t grad_in1 = wasm_v128_and(grad_out1, mask1);
        v128_t grad_in2 = wasm_v128_and(grad_out2, mask2);
        
        wasm_v128_store(&grad_input[i], grad_in1);
        wasm_v128_store(&grad_input[i + 4], grad_in2);
    }
    
    // Process remaining 4-element chunks
    int simd_length4 = length & ~3;
    for (; i < simd_length4; i += 4) {
        v128_t input_vec = wasm_v128_load(&input[i]);
        v128_t grad_out = wasm_v128_load(&grad_output[i]);
        
        v128_t mask = wasm_f32x4_gt(input_vec, zero);
        v128_t grad_in = wasm_v128_and(grad_out, mask);
        
        wasm_v128_store(&grad_input[i], grad_in);
    }
    
    // Process remaining elements (scalar)
    for (; i < length; i++) {
        grad_input[i] = (input[i] > 0.0f) ? grad_output[i] : 0.0f;
    }
}

// ============================================================================
// tanh_forward_simd: Apply tanh activation using fast approximation with SIMD
// Formula: tanh(x) ≈ x * (27 + x²) / (27 + 9x²)
// Parameters:
//   input = input vector pointer
//   output = output vector pointer
//   length = number of elements
// Returns:
//   void (writes to output)
// Optimizations:
//   - Fast polynomial approximation
//   - SIMD operations for parallel computation
//   - Clamping for extreme values
// ============================================================================
void tanh_forward_simd(float* input, float* output, int length) {
    if (length == 0) return;
    
    int i = 0;
    
    // Process 8 floats at a time using SIMD (loop unrolling)
    int simd_length = length & ~7;  // Round down to multiple of 8
    for (i = 0; i < simd_length; i += 8) {
        v128_t x1 = wasm_v128_load(&input[i]);
        v128_t x2 = wasm_v128_load(&input[i + 4]);
        
        // Clamp extreme values for stability
        v128_t min_val = wasm_f32x4_splat(-5.0f);
        v128_t max_val = wasm_f32x4_splat(5.0f);
        x1 = wasm_f32x4_max(wasm_f32x4_min(x1, max_val), min_val);
        x2 = wasm_f32x4_max(wasm_f32x4_min(x2, max_val), min_val);
        
        // Compute x²
        v128_t x_sq1 = wasm_f32x4_mul(x1, x1);
        v128_t x_sq2 = wasm_f32x4_mul(x2, x2);
        
        // Compute numerator: x * (27 + x²)
        v128_t c27 = wasm_f32x4_splat(27.0f);
        v128_t num1 = wasm_f32x4_mul(x1, wasm_f32x4_add(c27, x_sq1));
        v128_t num2 = wasm_f32x4_mul(x2, wasm_f32x4_add(c27, x_sq2));
        
        // Compute denominator: 27 + 9x²
        v128_t c9 = wasm_f32x4_splat(9.0f);
        v128_t denom1 = wasm_f32x4_add(c27, wasm_f32x4_mul(c9, x_sq1));
        v128_t denom2 = wasm_f32x4_add(c27, wasm_f32x4_mul(c9, x_sq2));
        
        // Compute tanh approximation
        v128_t result1 = wasm_f32x4_div(num1, denom1);
        v128_t result2 = wasm_f32x4_div(num2, denom2);
        
        wasm_v128_store(&output[i], result1);
        wasm_v128_store(&output[i + 4], result2);
    }
    
    // Process remaining 4-element chunks
    int simd_length4 = length & ~3;
    for (; i < simd_length4; i += 4) {
        v128_t x = wasm_v128_load(&input[i]);
        
        // Clamp extreme values
        v128_t min_val = wasm_f32x4_splat(-5.0f);
        v128_t max_val = wasm_f32x4_splat(5.0f);
        x = wasm_f32x4_max(wasm_f32x4_min(x, max_val), min_val);
        
        v128_t x_sq = wasm_f32x4_mul(x, x);
        v128_t c27 = wasm_f32x4_splat(27.0f);
        v128_t c9 = wasm_f32x4_splat(9.0f);
        
        v128_t num = wasm_f32x4_mul(x, wasm_f32x4_add(c27, x_sq));
        v128_t denom = wasm_f32x4_add(c27, wasm_f32x4_mul(c9, x_sq));
        v128_t result = wasm_f32x4_div(num, denom);
        
        wasm_v128_store(&output[i], result);
    }
    
    // Process remaining elements (scalar)
    for (; i < length; i++) {
        float x = input[i];
        // Clamp for stability
        if (x < -5.0f) x = -5.0f;
        if (x > 5.0f) x = 5.0f;
        
        float x_sq = x * x;
        output[i] = x * (27.0f + x_sq) / (27.0f + 9.0f * x_sq);
    }
}

// ============================================================================
// tanh_backward_simd: Compute tanh derivative using WASM SIMD
// Formula: 1 - tanh²(x)
// Parameters:
//   output = tanh output (pre-computed forward pass)
//   grad_output = gradient from next layer
//   grad_input = gradient to propagate (output)
//   length = number of elements
// Returns:
//   void (writes to grad_input)
// Optimizations:
//   - Uses pre-computed tanh output to avoid recomputation
//   - SIMD operations for parallel computation
//   - Loop unrolling for 8 elements at a time
// ============================================================================
void tanh_backward_simd(float* output, float* grad_output, float* grad_input, int length) {
    if (length == 0) return;
    
    v128_t one = wasm_f32x4_splat(1.0f);
    int i = 0;
    
    // Process 8 floats at a time using SIMD (loop unrolling)
    int simd_length = length & ~7;  // Round down to multiple of 8
    for (i = 0; i < simd_length; i += 8) {
        v128_t tanh_out1 = wasm_v128_load(&output[i]);
        v128_t tanh_out2 = wasm_v128_load(&output[i + 4]);
        v128_t grad_out1 = wasm_v128_load(&grad_output[i]);
        v128_t grad_out2 = wasm_v128_load(&grad_output[i + 4]);
        
        // Compute 1 - tanh²(x)
        v128_t tanh_sq1 = wasm_f32x4_mul(tanh_out1, tanh_out1);
        v128_t tanh_sq2 = wasm_f32x4_mul(tanh_out2, tanh_out2);
        v128_t derivative1 = wasm_f32x4_sub(one, tanh_sq1);
        v128_t derivative2 = wasm_f32x4_sub(one, tanh_sq2);
        
        // Multiply by gradient from next layer
        v128_t grad_in1 = wasm_f32x4_mul(grad_out1, derivative1);
        v128_t grad_in2 = wasm_f32x4_mul(grad_out2, derivative2);
        
        wasm_v128_store(&grad_input[i], grad_in1);
        wasm_v128_store(&grad_input[i + 4], grad_in2);
    }
    
    // Process remaining 4-element chunks
    int simd_length4 = length & ~3;
    for (; i < simd_length4; i += 4) {
        v128_t tanh_out = wasm_v128_load(&output[i]);
        v128_t grad_out = wasm_v128_load(&grad_output[i]);
        
        v128_t tanh_sq = wasm_f32x4_mul(tanh_out, tanh_out);
        v128_t derivative = wasm_f32x4_sub(one, tanh_sq);
        v128_t grad_in = wasm_f32x4_mul(grad_out, derivative);
        
        wasm_v128_store(&grad_input[i], grad_in);
    }
    
    // Process remaining elements (scalar)
    for (; i < length; i++) {
        float tanh_out = output[i];
        grad_input[i] = grad_output[i] * (1.0f - tanh_out * tanh_out);
    }
}

// ============================================================================
// update_weights: Update weights using gradient descent with WASM SIMD
// Formula: weights[i] -= learning_rate * gradients[i]
// Parameters:
//   weights = weight vector pointer (modified in place)
//   gradients = gradient vector pointer
//   lr = learning rate
//   length = number of elements
// Returns:
//   void (modifies weights in place)
// Optimizations:
//   - Loop unrolling for 8 elements at a time
//   - Reduced memory traffic with combined operations
//   - Better instruction-level parallelism
// ============================================================================
void update_weights(float* weights, float* gradients, float lr, int length) {
    v128_t lr_vec = wasm_f32x4_splat(lr);
    int i = 0;
    
    // Process 8 floats at a time using SIMD (loop unrolling)
    int simd_length = length & ~7;  // Round down to multiple of 8
    for (i = 0; i < simd_length; i += 8) {
        // Load first 4 elements
        v128_t grad1 = wasm_v128_load(&gradients[i]);
        v128_t w1 = wasm_v128_load(&weights[i]);
        
        // Load second 4 elements
        v128_t grad2 = wasm_v128_load(&gradients[i + 4]);
        v128_t w2 = wasm_v128_load(&weights[i + 4]);
        
        // Compute updates: weights -= lr * gradients
        v128_t new_w1 = wasm_f32x4_sub(w1, wasm_f32x4_mul(lr_vec, grad1));
        v128_t new_w2 = wasm_f32x4_sub(w2, wasm_f32x4_mul(lr_vec, grad2));
        
        // Store results
        wasm_v128_store(&weights[i], new_w1);
        wasm_v128_store(&weights[i + 4], new_w2);
    }
    
    // Process remaining 4-element chunks
    int simd_length4 = length & ~3;
    for (; i < simd_length4; i += 4) {
        v128_t grad = wasm_v128_load(&gradients[i]);
        v128_t w = wasm_v128_load(&weights[i]);
        v128_t new_w = wasm_f32x4_sub(w, wasm_f32x4_mul(lr_vec, grad));
        wasm_v128_store(&weights[i], new_w);
    }
    
    // Process remaining elements (scalar)
    for (; i < length; i++) {
        weights[i] -= lr * gradients[i];
    }
}
