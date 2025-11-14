/**
 * Automated tests for DataEncoder class
 * Run with: node test_encoder.js
 */

// Load the encoder (simulate browser environment)
import fs from 'fs';
const encoderCode = fs.readFileSync('src/web/encoder.js', 'utf8');

// Create a minimal module.exports for Node.js
const module = { exports: {} };
eval(encoderCode);
const DataEncoder = module.exports;

// Test utilities
let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
    if (condition) {
        console.log(`✓ ${message}`);
        testsPassed++;
    } else {
        console.error(`✗ ${message}`);
        testsFailed++;
    }
}

function assertEquals(actual, expected, message) {
    if (actual === expected) {
        console.log(`✓ ${message}`);
        testsPassed++;
    } else {
        console.error(`✗ ${message}`);
        console.error(`  Expected: ${expected}`);
        console.error(`  Actual: ${actual}`);
        testsFailed++;
    }
}

console.log('⚡ DATAENCODER AUTOMATED TESTS ⚡\n');

// Test 1: Type Detection
console.log('Test 1: Type Detection');
console.log('─────────────────────────────');
const encoder1 = new DataEncoder();
const mixedData = [
    { x1: '10', x2: 'red', x3: '5.5', y: 'yes' },
    { x1: '20', x2: 'blue', x3: '6.2', y: 'no' },
    { x1: '15', x2: 'red', x3: '4.8', y: 'yes' }
];

encoder1.detectTypes(mixedData);
assertEquals(encoder1.columnTypes.x1, 'numeric', 'x1 detected as numeric');
assertEquals(encoder1.columnTypes.x2, 'categorical', 'x2 detected as categorical');
assertEquals(encoder1.columnTypes.x3, 'numeric', 'x3 detected as numeric');
assertEquals(encoder1.columnTypes.y, 'categorical', 'y detected as categorical');
console.log('');

// Test 2: Encoding Dataset
console.log('Test 2: Encoding Dataset');
console.log('─────────────────────────────');
const encoded = encoder1.encodeDataset(mixedData);
assertEquals(encoded[0].x1, 10, 'Numeric value preserved (x1)');
assertEquals(encoded[0].x3, 5.5, 'Numeric value preserved (x3)');
assert(typeof encoded[0].x2 === 'number', 'Categorical value encoded to number (x2)');
assert(typeof encoded[0].y === 'number', 'Categorical value encoded to number (y)');
console.log('');

// Test 3: Encoding Consistency
console.log('Test 3: Encoding Consistency');
console.log('─────────────────────────────');
const redEncoding1 = encoder1.encodeValue('x2', 'red');
const redEncoding2 = encoder1.encodeValue('x2', 'red');
assertEquals(redEncoding1, redEncoding2, 'Same value gets same encoding');

const blueEncoding = encoder1.encodeValue('x2', 'blue');
assert(redEncoding1 !== blueEncoding, 'Different values get different encodings');
console.log('');

// Test 4: Bidirectional Encoding/Decoding
console.log('Test 4: Bidirectional Encoding/Decoding');
console.log('─────────────────────────────');
const originalValue = 'red';
const encodedValue = encoder1.encodeValue('x2', originalValue);
const decodedValue = encoder1.decodeValue('x2', encodedValue);
assertEquals(decodedValue, originalValue, 'Encode -> Decode returns original value');

// Test all categorical values
const categoricalValues = ['red', 'blue'];
let allConsistent = true;
for (const value of categoricalValues) {
    const enc = encoder1.encodeValue('x2', value);
    const dec = encoder1.decodeValue('x2', enc);
    if (dec !== value) {
        allConsistent = false;
    }
}
assert(allConsistent, 'All categorical values encode/decode consistently');
console.log('');

// Test 5: Unknown Value Handling
console.log('Test 5: Unknown Value Handling');
console.log('─────────────────────────────');
const unknownEncoded = encoder1.encodeValue('x2', 'green');
assertEquals(unknownEncoded, null, 'Unknown categorical value returns null');

const knownEncoded = encoder1.encodeValue('x2', 'red');
assert(knownEncoded !== null, 'Known categorical value returns number');
console.log('');

// Test 6: Numeric-Only Data (Backward Compatibility)
console.log('Test 6: Backward Compatibility (Numeric-Only)');
console.log('─────────────────────────────');
const encoder2 = new DataEncoder();
const numericData = [
    { x1: '10', x2: '20', y: '100' },
    { x1: '15', x2: '25', y: '150' },
    { x1: '20', x2: '30', y: '200' }
];

encoder2.detectTypes(numericData);
assertEquals(encoder2.columnTypes.x1, 'numeric', 'x1 detected as numeric');
assertEquals(encoder2.columnTypes.x2, 'numeric', 'x2 detected as numeric');
assertEquals(encoder2.columnTypes.y, 'numeric', 'y detected as numeric');

const encodedNumeric = encoder2.encodeDataset(numericData);
assertEquals(encodedNumeric[0].x1, 10, 'Numeric value preserved');
assertEquals(encodedNumeric[0].x2, 20, 'Numeric value preserved');
assertEquals(encodedNumeric[0].y, 100, 'Numeric value preserved');
console.log('');

// Test 7: Categorical-Only Data
console.log('Test 7: Categorical-Only Data');
console.log('─────────────────────────────');
const encoder3 = new DataEncoder();
const categoricalData = [
    { x1: 'red', x2: 'small', y: 'apple' },
    { x1: 'yellow', x2: 'medium', y: 'banana' },
    { x1: 'orange', x2: 'medium', y: 'orange' }
];

encoder3.detectTypes(categoricalData);
assertEquals(encoder3.columnTypes.x1, 'categorical', 'x1 detected as categorical');
assertEquals(encoder3.columnTypes.x2, 'categorical', 'x2 detected as categorical');
assertEquals(encoder3.columnTypes.y, 'categorical', 'y detected as categorical');

const encodedCategorical = encoder3.encodeDataset(categoricalData);
assert(typeof encodedCategorical[0].x1 === 'number', 'Categorical encoded to number');
assert(typeof encodedCategorical[0].x2 === 'number', 'Categorical encoded to number');
assert(typeof encodedCategorical[0].y === 'number', 'Categorical encoded to number');
console.log('');

// Test 8: Encoding Summary
console.log('Test 8: Encoding Summary');
console.log('─────────────────────────────');
const summary = encoder1.getEncodingSummary();
assert(summary.includes('Numeric'), 'Summary includes numeric type');
assert(summary.includes('Categorical'), 'Summary includes categorical type');
assert(summary.includes('→'), 'Summary includes encoding mappings');
console.log('Summary generated successfully');
console.log('');

// Test 9: Helper Methods
console.log('Test 9: Helper Methods');
console.log('─────────────────────────────');
assert(encoder1.isCategorical('x2'), 'isCategorical() works for categorical column');
assert(!encoder1.isCategorical('x1'), 'isCategorical() works for numeric column');
assert(encoder1.isNumeric('x1'), 'isNumeric() works for numeric column');
assert(!encoder1.isNumeric('x2'), 'isNumeric() works for categorical column');

const categoricalVals = encoder1.getCategoricalValues('x2');
assert(Array.isArray(categoricalVals), 'getCategoricalValues() returns array');
assert(categoricalVals.length > 0, 'getCategoricalValues() returns values');
console.log('');

// Test 10: Real-World CSV Data
console.log('Test 10: Real-World CSV Data');
console.log('─────────────────────────────');

// Load and test example_mixed.csv
const mixedCSV = fs.readFileSync('src/data/example_mixed.csv', 'utf8');
const lines = mixedCSV.trim().split('\n');
const headers = lines[0].split(',').map(h => h.trim());

const csvData = [];
for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const row = {};
    headers.forEach((header, idx) => {
        row[header] = values[idx];
    });
    csvData.push(row);
}

const encoder4 = new DataEncoder();
encoder4.detectTypes(csvData);

assertEquals(encoder4.columnTypes.age, 'numeric', 'age detected as numeric');
assertEquals(encoder4.columnTypes.membership, 'categorical', 'membership detected as categorical');
assertEquals(encoder4.columnTypes.income, 'numeric', 'income detected as numeric');
assertEquals(encoder4.columnTypes.purchased, 'categorical', 'purchased detected as categorical');

const encodedCSV = encoder4.encodeDataset(csvData);
assert(encodedCSV.length === csvData.length, 'All rows encoded');
assert(typeof encodedCSV[0].age === 'number', 'Age is numeric');
assert(typeof encodedCSV[0].membership === 'number', 'Membership encoded to number');
console.log('');

// Summary
console.log('═════════════════════════════');
console.log('TEST SUMMARY');
console.log('═════════════════════════════');
console.log(`Tests Passed: ${testsPassed}`);
console.log(`Tests Failed: ${testsFailed}`);
console.log(`Total Tests: ${testsPassed + testsFailed}`);

if (testsFailed === 0) {
    console.log('\n✓ ALL TESTS PASSED! ✓');
    process.exit(0);
} else {
    console.log(`\n✗ ${testsFailed} TEST(S) FAILED ✗`);
    process.exit(1);
}
