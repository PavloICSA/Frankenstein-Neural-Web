# Design Document

## Overview

This design extends the Frankenstein Neural Web application to support mixed data types (strings and numerics) through an encoding system, implements a prediction interface for trained models, and adds user guidance and standard web sections. The solution maintains the existing WASM SIMD architecture while adding a JavaScript-based data preprocessing layer.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Web Interface Layer                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Instructions │  │ Main App UI  │  │ Terms/Privacy/   │  │
│  │   Section    │  │              │  │   Contact        │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  Data Processing Layer (JS)                  │
│  ┌──────────────────────┐  ┌──────────────────────────┐    │
│  │  CSV Parser with     │  │  Encoding/Decoding       │    │
│  │  Type Detection      │  │  System                  │    │
│  └──────────────────────┘  └──────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Existing WASM Layer (Unchanged)                 │
│  ┌──────────────────────┐  ┌──────────────────────────┐    │
│  │  C Orchestration     │  │  SIMD Computations       │    │
│  │  (ann_wrapper.c)     │  │  (ann_simd.c)            │    │
│  └──────────────────────┘  └──────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

```
CSV Upload → Type Detection → Encoding → WASM Training → Model Ready
                                                              │
User Input → Encoding → WASM Prediction → Decoding → Display Result
```

## Components and Interfaces

### 1. Data Type Detection and Encoding System

**Location**: `src/web/app.js` (new module)

**Purpose**: Automatically detect data types and convert strings to numeric representations for ANN processing.

**Key Classes/Functions**:

```javascript
class DataEncoder {
    constructor() {
        this.encodingMaps = {};  // { columnName: { stringValue: numericCode } }
        this.decodingMaps = {};  // { columnName: { numericCode: stringValue } }
        this.columnTypes = {};   // { columnName: 'numeric' | 'categorical' }
    }
    
    detectTypes(data) { /* ... */ }
    encodeDataset(data) { /* ... */ }
    encodeValue(columnName, value) { /* ... */ }
    decodeValue(columnName, numericValue) { /* ... */ }
    getEncodingSummary() { /* ... */ }
}
```

**Type Detection Logic**:
- Attempt to parse each value as a number
- If parsing fails for any value in a column, mark as categorical
- Categorical columns get label encoding (unique strings → 0, 1, 2, ...)
- Numeric columns pass through unchanged

**Encoding Strategy**:
- Label Encoding: Assign sequential integers to unique string values
- Maintain bidirectional mappings for encoding/decoding
- Handle unknown values during prediction with warning messages

### 2. Enhanced CSV Parser

**Location**: `src/web/app.js` (modification)

**Changes to `parseCSV` function**:
- Remove strict numeric validation
- Accept mixed data types
- Integrate with DataEncoder for type detection
- Return encoded numeric data + encoding metadata

**New Return Structure**:
```javascript
{
    n_inputs: number,
    inputs: Float32Array,      // Encoded numeric values
    outputs: Float32Array,     // Encoded numeric values
    n_rows: number,
    encoder: DataEncoder,      // Reference to encoder instance
    columnNames: string[]      // Original column names
}
```

### 3. Prediction Interface Enhancement

**Location**: `src/web/index.html` and `src/web/app.js`

**UI Components**:
- Dynamic input field generation based on column types
- Text inputs for categorical features (with autocomplete suggestions)
- Number inputs for numeric features
- Real-time validation and encoding feedback
- Display decoded predictions when output is categorical

**New Functions**:
```javascript
function generatePredictionInputs(n_inputs, encoder, columnNames) { /* ... */ }
function makePrediction() { /* Enhanced with encoding/decoding */ }
function displayPredictionResult(prediction, encoder) { /* ... */ }
```

**Prediction Flow**:
1. User enters values (strings or numbers)
2. Validate inputs against known encodings
3. Encode categorical values to numeric
4. Pass encoded array to WASM
5. Receive numeric prediction
6. Decode if output was categorical
7. Display result with original labels

### 4. User Guidance Section

**Location**: `src/web/index.html` (new section)

**Content Structure**:
```html
<section class="instructions-section">
    <h2>[ HOW TO USE ]</h2>
    
    <div class="instruction-block">
        <h3>Data Preparation</h3>
        <!-- CSV format requirements -->
        <!-- Example datasets -->
        <!-- Data type guidelines -->
    </div>
    
    <div class="instruction-block">
        <h3>Training Process</h3>
        <!-- Step-by-step training guide -->
        <!-- Interpreting loss values -->
    </div>
    
    <div class="instruction-block">
        <h3>Making Predictions</h3>
        <!-- How to use prediction interface -->
        <!-- Understanding results -->
    </div>
    
    <div class="instruction-block">
        <h3>Example Datasets</h3>
        <!-- Downloadable sample CSVs -->
        <!-- Use case examples -->
    </div>
</section>
```

**Styling**: Collapsible accordion-style sections with Frankenstein theme

### 5. Standard Web Sections

**Location**: `src/web/index.html` (new sections)

**Implementation Approach**: Modal dialogs or separate sections

**Components**:

```html
<!-- Footer Navigation -->
<footer>
    <nav class="footer-nav">
        <a href="#" id="instructionsLink">Instructions</a>
        <a href="#" id="termsLink">Terms of Service</a>
        <a href="#" id="privacyLink">Privacy Policy</a>
        <a href="#" id="contactLink">Contact</a>
    </nav>
    <p>Powered by WebAssembly SIMD</p>
</footer>

<!-- Modal Template -->
<div id="modalOverlay" class="modal-overlay">
    <div class="modal-content">
        <button class="modal-close">&times;</button>
        <div id="modalBody"></div>
    </div>
</div>
```

**Content**:
- **Terms of Service**: Educational use, no warranties, attribution requirements
- **Privacy Policy**: Client-side processing, no data collection, browser storage only
- **Contact**: GitHub issues, email, contribution guidelines

## Data Models

### Encoding Metadata Structure

```javascript
{
    columnTypes: {
        'x1': 'numeric',
        'x2': 'categorical',
        'x3': 'categorical',
        'y': 'categorical'
    },
    encodingMaps: {
        'x2': { 'red': 0, 'blue': 1, 'green': 2 },
        'x3': { 'small': 0, 'medium': 1, 'large': 2 },
        'y': { 'yes': 0, 'no': 1 }
    },
    decodingMaps: {
        'x2': { 0: 'red', 1: 'blue', 2: 'green' },
        'x3': { 0: 'small', 1: 'medium', 2: 'large' },
        'y': { 0: 'yes', 1: 'no' }
    }
}
```

### Enhanced Parsed Data Structure

```javascript
{
    n_inputs: 3,
    inputs: Float32Array([...]),  // Encoded values
    outputs: Float32Array([...]), // Encoded values
    n_rows: 100,
    encoder: DataEncoder,
    columnNames: ['x1', 'x2', 'x3'],
    outputColumnName: 'y'
}
```

## Error Handling

### Unknown Categorical Values

**Scenario**: User enters a string value during prediction that wasn't in training data

**Handling**:
1. Detect unknown value before encoding
2. Display warning message: "Warning: '[value]' not found in training data for [column]. Using closest match or default."
3. Options:
   - Use default encoding (e.g., 0)
   - Suggest closest match from known values
   - Block prediction and require valid input

**Implementation**:
```javascript
function validateCategoricalInput(columnName, value, encoder) {
    if (!encoder.encodingMaps[columnName][value]) {
        return {
            valid: false,
            message: `Unknown value '${value}' for ${columnName}`,
            suggestions: Object.keys(encoder.encodingMaps[columnName])
        };
    }
    return { valid: true };
}
```

### Type Mismatch Errors

**Scenario**: User enters wrong type during prediction (string for numeric column, etc.)

**Handling**:
1. Validate input type matches column type
2. Display clear error message
3. Provide input format hints

### CSV Parsing Errors

**Enhanced Error Messages**:
- "Column [name] contains mixed types. Please ensure consistent data types."
- "Too many unique values in column [name] ([count] unique). Consider if this should be numeric."
- "Empty values detected in column [name]. Please fill or remove rows."

## Testing Strategy

### Unit Testing Approach

**Test Files**: `src/web/tests/encoder.test.js`

**Key Test Cases**:

1. **Type Detection**:
   - All numeric columns
   - All categorical columns
   - Mixed numeric and categorical
   - Edge cases (empty strings, special characters)

2. **Encoding/Decoding**:
   - Bidirectional consistency (encode → decode = original)
   - Multiple columns with same values
   - Case sensitivity handling
   - Whitespace handling

3. **Prediction with Mixed Data**:
   - Numeric-only predictions (existing functionality)
   - Categorical-only predictions
   - Mixed predictions
   - Unknown value handling

4. **CSV Parsing**:
   - Valid mixed-type CSV
   - Invalid format detection
   - Empty file handling
   - Large dataset performance

### Integration Testing

**Test Scenarios**:

1. **End-to-End Flow**:
   - Upload mixed CSV → Train → Predict with categorical inputs → Verify decoded output

2. **UI Interaction**:
   - Dynamic input field generation
   - Autocomplete suggestions
   - Error message display
   - Modal navigation

3. **WASM Integration**:
   - Encoded data passes correctly to WASM
   - Predictions return expected numeric values
   - Memory management with larger datasets

### Manual Testing Checklist

- [ ] Upload CSV with all numeric data (existing functionality)
- [ ] Upload CSV with all categorical data
- [ ] Upload CSV with mixed data types
- [ ] Train on mixed data and verify encoding summary
- [ ] Make predictions with categorical inputs
- [ ] Test unknown value warnings
- [ ] Verify decoded predictions display correctly
- [ ] Test all instruction sections
- [ ] Navigate through Terms/Privacy/Contact modals
- [ ] Test on different browsers (Chrome, Firefox, Safari)
- [ ] Test responsive design on mobile devices

## UI/UX Enhancements

### Encoding Summary Display

**Location**: After successful CSV upload

**Content**:
```
Data Summary:
- Total Rows: 100
- Input Features: 3
- Data Types Detected:
  • x1: Numeric (range: 0.5 - 10.2)
  • x2: Categorical (3 categories: red, blue, green)
  • x3: Categorical (3 categories: small, medium, large)
  • y: Categorical (2 categories: yes, no)
```

### Prediction Input Enhancements

**Categorical Inputs**:
- Dropdown select with known values
- Or text input with autocomplete
- Display encoding hint: "red → 0, blue → 1, green → 2"

**Numeric Inputs**:
- Show range from training data
- Validation for out-of-range warnings

### Prediction Output Enhancements

**Display Format**:
```
Prediction: yes (decoded from 0.92 → 1)
Confidence: 92%
```

## Performance Considerations

### Encoding Performance

- **Time Complexity**: O(n × m) where n = rows, m = columns
- **Space Complexity**: O(k) where k = unique categorical values
- **Optimization**: Cache encoding maps, avoid repeated lookups

### Memory Management

- Encoding maps stored in JavaScript (minimal overhead)
- WASM memory unchanged (still receives Float32Array)
- No additional WASM memory allocation needed

### Browser Compatibility

- DataEncoder uses standard JavaScript (ES6+)
- No additional dependencies required
- Maintains existing WASM SIMD requirements

## Security and Privacy

### Data Handling

- All processing remains client-side
- No data sent to external servers
- Encoding maps stored only in browser memory
- Optional: localStorage for saving trained models (future enhancement)

### Privacy Policy Content

Key points to include:
- No server-side data transmission
- No cookies or tracking
- Browser-only computation
- No personal data collection
- Open-source transparency

## Future Enhancements

### Potential Improvements (Out of Scope)

1. **Advanced Encoding**:
   - One-hot encoding for categorical variables
   - Ordinal encoding with custom ordering
   - Feature scaling/normalization

2. **Model Persistence**:
   - Save/load trained models
   - Export encoding maps
   - Import pre-trained models

3. **Enhanced Predictions**:
   - Batch predictions from CSV
   - Confidence intervals
   - Feature importance visualization

4. **Data Validation**:
   - Automatic outlier detection
   - Missing value imputation
   - Data quality scoring

## Implementation Notes

### Backward Compatibility

- Existing numeric-only CSV files continue to work
- No changes to WASM layer required
- Graceful degradation for older browsers

### Code Organization

```
src/web/
├── app.js              # Main application logic
├── encoder.js          # NEW: DataEncoder class
├── ui-helpers.js       # NEW: UI utility functions
├── modal-manager.js    # NEW: Modal dialog management
├── index.html          # Enhanced with new sections
└── style.css           # Enhanced with new styles
```

### Dependencies

No new external dependencies required. Implementation uses:
- Vanilla JavaScript (ES6+)
- Existing Emscripten WASM integration
- Standard HTML5/CSS3

## Design Decisions and Rationales

### Why Label Encoding?

**Decision**: Use label encoding (sequential integers) for categorical variables

**Rationale**:
- Simple to implement and understand
- Minimal memory overhead
- Compatible with existing ANN architecture
- Sufficient for educational purposes
- One-hot encoding would require architecture changes

**Trade-offs**:
- May introduce ordinal relationships where none exist
- Less optimal than one-hot for some use cases
- Acceptable for demonstration and learning

### Why Client-Side Encoding?

**Decision**: Implement encoding in JavaScript rather than C/WASM

**Rationale**:
- Easier to maintain and debug
- No WASM recompilation needed
- Better error messages and user feedback
- Minimal performance impact (encoding is not bottleneck)
- Keeps WASM layer focused on computation

### Why Modal Dialogs for Terms/Privacy?

**Decision**: Use modal overlays instead of separate pages

**Rationale**:
- Maintains single-page application flow
- Faster navigation
- Consistent with Frankenstein theme
- No server routing required
- Better user experience for quick reference

### Why Not Separate Instruction Page?

**Decision**: Include instructions in main page as collapsible section

**Rationale**:
- Reduces friction for new users
- Context-aware help
- No navigation required
- Progressive disclosure of information
- Maintains focus on main application
