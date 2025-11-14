# Test Data Files

This directory contains test datasets for the Frankenstein Neural Web project.

## Files

### Training Data

- **sample.csv** - Original sample dataset with 3 inputs (x1, x2, x3)
  - 10 training samples
  - General purpose testing

- **test_linear.csv** - Linear relationship dataset (y = 2*x1 + 3*x2)
  - 12 training samples
  - 2 inputs
  - Used for integration testing
  - Expected to converge to low loss

### Error Testing Data

- **test_invalid_header.csv** - Invalid header format (a,b,c instead of x1,x2,y)
  - Tests CSV validation
  - Should be rejected with error message

- **test_non_numeric.csv** - Contains non-numeric data ("abc")
  - Tests data type validation
  - Should be rejected with error message

- **test_missing_column.csv** - Inconsistent column counts
  - Tests row validation
  - Should be rejected with error message

## CSV Format Requirements

All valid CSV files must follow this format:

```
x1,x2,...,xN,y
value1,value2,...,valueN,output1
value1,value2,...,valueN,output2
...
```

**Rules**:
- First row must be headers
- Input columns must be named x1, x2, x3, etc. (sequential)
- Last column must be named "y"
- Number of inputs must be between 1 and 10
- All data values must be numeric (floats or integers)
- Each row must have the same number of columns

## Creating Your Own Test Data

To create a custom dataset:

1. Choose your number of inputs (1-10)
2. Create header row: `x1,x2,...,xN,y`
3. Add data rows with numeric values
4. Save as `.csv` file
5. Upload through the web interface

### Example: Simple XOR-like Problem

```csv
x1,x2,y
0.0,0.0,0.0
0.0,1.0,1.0
1.0,0.0,1.0
1.0,1.0,0.0
```

### Example: Linear Regression

```csv
x1,y
1.0,2.0
2.0,4.0
3.0,6.0
4.0,8.0
```

## Usage

1. Start the application: `http://localhost:8000/src/web/index.html`
2. Click or drag-drop a CSV file to upload
3. Wait for validation message
4. Click "Train Neural Core" if validation passes
5. Make predictions after training completes
