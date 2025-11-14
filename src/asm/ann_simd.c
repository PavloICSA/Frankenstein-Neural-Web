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
