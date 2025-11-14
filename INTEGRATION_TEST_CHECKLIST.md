# Integration Test Checklist

## Setup

1. Build: `./build.sh` or `build.bat`
2. Serve: `python -m http.server 8000`
3. Open: `http://localhost:8000/src/web/index.html`

---

## Test 1: DataEncoder Integration with CSV Parser

### Test 1.1: Mixed Data CSV Upload
- [ ] Upload `src/data/example_mixed.csv`
- [ ] Verify validation message shows success
- [ ] Check terminal shows encoding summary
- [ ] Confirm categorical columns are detected (e.g., "membership")
- [ ] Confirm numeric columns are detected (e.g., "age", "income")
- [ ] Verify encoding mappings are displayed (e.g., "bronze→0, gold→1, silver→2")

**Expected Output:**
```
[DATA] Loaded X samples with Y features
[ENCODING] Data type detection complete:
[ENCODING] Data Encoding Summary:
[ENCODING]   • age: Numeric
[ENCODING]   • membership: Categorical (3 categories)
[ENCODING]     Encoding: bronze→0, gold→1, silver→2
```

### Test 1.2: Categorical-Only CSV Upload
- [ ] Upload `src/data/example_categorical.csv`
- [ ] Verify all columns detected as categorical
- [ ] Check encoding mappings for each column
- [ ] Confirm no numeric columns in summary

### Test 1.3: Numeric-Only CSV Upload (Backward Compatibility)
- [ ] Upload `src/data/example_numeric.csv` or `src/data/sample.csv`
- [ ] Verify all columns detected as numeric
- [ ] Confirm encoding summary shows "Numeric" for all columns
- [ ] Verify no categorical encoding mappings

---

## Test 2: Training with Mixed Data

### Test 2.1: Train on Mixed Data
- [ ] Upload `src/data/example_mixed.csv`
- [ ] Click "Train Neural Core"
- [ ] Verify training starts and loss values appear
- [ ] Confirm training completes successfully
- [ ] Check final loss value is reasonable (< 0.5)
- [ ] Verify network configuration is displayed

**Expected Output:**
```
[CORE] Reanimation sequence initiated...
[LEARNING] Synaptic calibration in progress...
[DATA] Training on X samples with Y features
[NEURAL] Initializing synaptic weights...
[STATUS] Training complete. Final loss: 0.XXXXXX
[CORE] Neural pathways established successfully
```

### Test 2.2: Train on Categorical Data
- [ ] Upload `src/data/example_categorical.csv`
- [ ] Train the network
- [ ] Verify training completes without errors
- [ ] Confirm encoded values are used internally

### Test 2.3: Train on Numeric Data
- [ ] Upload `src/data/example_numeric.csv`
- [ ] Train the network
- [ ] Verify backward compatibility maintained
- [ ] Confirm training works as before

---

## Test 3: Prediction Interface with Mixed Data

### Test 3.1: Categorical Input Fields
- [ ] After training on mixed data, check prediction section appears
- [ ] Verify categorical columns have dropdown selects
- [ ] Confirm dropdowns contain correct values from training data
- [ ] Check encoding hints are displayed next to dropdowns
- [ ] Verify numeric columns have number inputs

**Expected UI:**
```
age: [number input]
membership: [dropdown: bronze, gold, silver] (bronze→0, gold→1, silver→2)
income: [number input]
```

### Test 3.2: Make Prediction with Categorical Inputs
- [ ] Select categorical values from dropdowns
- [ ] Enter numeric values in number inputs
- [ ] Click "Predict"
- [ ] Verify prediction is displayed
- [ ] Check terminal shows input values and prediction

**Example:**
```
Input: age=30, membership=gold, income=70000
Expected: Prediction displayed (e.g., "yes" or "no")
```

### Test 3.3: Prediction Output Decoding
- [ ] Make a prediction where output is categorical
- [ ] Verify output is decoded to original label (e.g., "yes" not "0.98")
- [ ] Check confidence value is shown
- [ ] Confirm terminal displays decoded output

**Expected Output:**
```
ŷ = yes (confidence: 0.9234)
[PREDICT] Input: [30, gold, 70000] → Output: yes (confidence: 0.9234)
```

---

## Test 4: Unknown Value Warnings

### Test 4.1: Enter Unknown Categorical Value
- [ ] Train on `example_mixed.csv` (has bronze, gold, silver)
- [ ] In prediction, try to enter "platinum" (not in training data)
- [ ] Verify warning message appears in terminal
- [ ] Check warning lists valid values
- [ ] Confirm prediction still executes with fallback value

**Expected Warning:**
```
⚠️ "platinum" is not a known value for membership. Valid values: bronze, gold, silver
[WARNING] Prediction may be inaccurate due to unknown categorical values
```

### Test 4.2: Multiple Unknown Values
- [ ] Enter multiple unknown categorical values
- [ ] Verify separate warning for each unknown value
- [ ] Confirm prediction proceeds with warnings

---

## Test 5: Encoding/Decoding Consistency

### Test 5.1: Bidirectional Consistency
- [ ] Train on categorical data
- [ ] Make prediction with known categorical value
- [ ] Verify input is encoded correctly (check terminal logs if available)
- [ ] Verify output is decoded correctly
- [ ] Repeat with different categorical values

### Test 5.2: Same Value Consistency
- [ ] Make prediction with value "red"
- [ ] Make another prediction with value "red"
- [ ] Verify both predictions use same encoding
- [ ] Confirm consistent results for same inputs

---

## Summary

- [ ] Mixed data upload and encoding works
- [ ] Training works with encoded data
- [ ] Prediction interface adapts to data types
- [ ] Categorical inputs use dropdowns
- [ ] Numeric inputs use number fields
- [ ] Output decoding works correctly
- [ ] Unknown values trigger warnings
- [ ] Backward compatibility maintained
- [ ] Error handling is robust

---

## Test Results

- **Date:** _______________
- **Browser:** _______________
- **Status:** [ ] PASS [ ] FAIL
