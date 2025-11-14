/**
 * DataEncoder - Handles mixed data type encoding/decoding for ANN training
 * Converts categorical (string) values to numeric representations and maintains
 * bidirectional mappings for encoding and decoding.
 */
class DataEncoder {
    constructor() {
        // Maps column names to { stringValue: numericCode }
        this.encodingMaps = {};
        
        // Maps column names to { numericCode: stringValue }
        this.decodingMaps = {};
        
        // Maps column names to 'numeric' or 'categorical'
        this.columnTypes = {};
        
        // Stores column names in order
        this.columnNames = [];
    }

    /**
     * Detects whether each column contains numeric or categorical data
     * @param {Array<Object>} data - Array of row objects with column names as keys
     * @returns {Object} Column types mapping
     */
    detectTypes(data) {
        if (!data || data.length === 0) {
            throw new Error('Cannot detect types: data is empty');
        }

        // Get column names from first row
        this.columnNames = Object.keys(data[0]);

        // Check each column
        for (const columnName of this.columnNames) {
            let isNumeric = true;

            // Check all values in this column
            for (const row of data) {
                const value = row[columnName];
                
                // Skip empty values for now
                if (value === null || value === undefined || value === '') {
                    continue;
                }

                // Try to parse as number
                const numValue = Number(value);
                
                // If parsing fails or results in NaN, it's categorical
                if (isNaN(numValue)) {
                    isNumeric = false;
                    break;
                }
            }

            this.columnTypes[columnName] = isNumeric ? 'numeric' : 'categorical';
        }

        return this.columnTypes;
    }

    /**
     * Encodes a complete dataset, converting categorical values to numeric codes
     * @param {Array<Object>} data - Array of row objects
     * @returns {Array<Object>} Encoded data with all numeric values
     */
    encodeDataset(data) {
        if (!data || data.length === 0) {
            throw new Error('Cannot encode: data is empty');
        }

        // Detect types if not already done
        if (Object.keys(this.columnTypes).length === 0) {
            this.detectTypes(data);
        }

        // Build encoding maps for categorical columns
        for (const columnName of this.columnNames) {
            if (this.columnTypes[columnName] === 'categorical') {
                this._buildEncodingMap(columnName, data);
            }
        }

        // Encode all rows
        const encodedData = data.map(row => {
            const encodedRow = {};
            
            for (const columnName of this.columnNames) {
                const value = row[columnName];
                
                if (this.columnTypes[columnName] === 'categorical') {
                    encodedRow[columnName] = this.encodeValue(columnName, value);
                } else {
                    // Numeric column - convert to number
                    encodedRow[columnName] = Number(value);
                }
            }
            
            return encodedRow;
        });

        return encodedData;
    }

    /**
     * Builds encoding/decoding maps for a categorical column
     * @private
     * @param {string} columnName - Name of the column
     * @param {Array<Object>} data - Complete dataset
     */
    _buildEncodingMap(columnName, data) {
        // Get unique values
        const uniqueValues = new Set();
        
        for (const row of data) {
            const value = row[columnName];
            if (value !== null && value !== undefined && value !== '') {
                uniqueValues.add(String(value));
            }
        }

        // Create encoding map (string -> number)
        const encodingMap = {};
        const decodingMap = {};
        let code = 0;

        // Sort unique values for consistent encoding
        const sortedValues = Array.from(uniqueValues).sort();
        
        for (const value of sortedValues) {
            encodingMap[value] = code;
            decodingMap[code] = value;
            code++;
        }

        this.encodingMaps[columnName] = encodingMap;
        this.decodingMaps[columnName] = decodingMap;
    }

    /**
     * Encodes a single value for a specific column
     * @param {string} columnName - Name of the column
     * @param {*} value - Value to encode
     * @returns {number} Encoded numeric value
     */
    encodeValue(columnName, value) {
        // Handle empty values
        if (value === null || value === undefined || value === '') {
            return 0;
        }

        // If numeric column, just convert to number
        if (this.columnTypes[columnName] === 'numeric') {
            return Number(value);
        }

        // Categorical column - look up encoding
        const stringValue = String(value);
        const encodingMap = this.encodingMaps[columnName];

        if (!encodingMap) {
            throw new Error(`No encoding map found for column: ${columnName}`);
        }

        if (encodingMap[stringValue] === undefined) {
            // Unknown value - return null to signal warning
            return null;
        }

        return encodingMap[stringValue];
    }

    /**
     * Decodes a numeric value back to its original string representation
     * @param {string} columnName - Name of the column
     * @param {number} numericValue - Encoded numeric value
     * @returns {string|number} Decoded original value
     */
    decodeValue(columnName, numericValue) {
        // If numeric column, return as-is
        if (this.columnTypes[columnName] === 'numeric') {
            return numericValue;
        }

        // Categorical column - look up decoding
        const decodingMap = this.decodingMaps[columnName];

        if (!decodingMap) {
            throw new Error(`No decoding map found for column: ${columnName}`);
        }

        // Round to nearest integer for decoding
        const code = Math.round(numericValue);

        if (decodingMap[code] === undefined) {
            return `Unknown(${numericValue})`;
        }

        return decodingMap[code];
    }

    /**
     * Generates a human-readable summary of detected types and encodings
     * @returns {string} Formatted summary text
     */
    getEncodingSummary() {
        const lines = [];
        lines.push('Data Encoding Summary:');
        lines.push('');

        for (const columnName of this.columnNames) {
            const type = this.columnTypes[columnName];
            
            if (type === 'numeric') {
                lines.push(`  • ${columnName}: Numeric`);
            } else if (type === 'categorical') {
                const encodingMap = this.encodingMaps[columnName];
                const categories = Object.keys(encodingMap).length;
                const mappings = Object.entries(encodingMap)
                    .map(([str, num]) => `${str}→${num}`)
                    .join(', ');
                
                lines.push(`  • ${columnName}: Categorical (${categories} categories)`);
                lines.push(`    Encoding: ${mappings}`);
            }
        }

        return lines.join('\n');
    }

    /**
     * Gets the list of valid categorical values for a column
     * @param {string} columnName - Name of the column
     * @returns {Array<string>} List of valid values, or empty array if numeric
     */
    getCategoricalValues(columnName) {
        if (this.columnTypes[columnName] !== 'categorical') {
            return [];
        }

        const encodingMap = this.encodingMaps[columnName];
        if (!encodingMap) {
            return [];
        }

        return Object.keys(encodingMap).sort();
    }

    /**
     * Checks if a column is categorical
     * @param {string} columnName - Name of the column
     * @returns {boolean} True if categorical, false otherwise
     */
    isCategorical(columnName) {
        return this.columnTypes[columnName] === 'categorical';
    }

    /**
     * Checks if a column is numeric
     * @param {string} columnName - Name of the column
     * @returns {boolean} True if numeric, false otherwise
     */
    isNumeric(columnName) {
        return this.columnTypes[columnName] === 'numeric';
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataEncoder;
}
