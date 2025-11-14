// Web interface logic and WASM integration

let wasm = null;
let parsedData = null;
let isNetworkTrained = false;
let predictionHistory = [];

// Initialize WASM module
async function initWASM() {
    try {
        // Module is a factory function that returns a Promise when MODULARIZE=1
        const module = await Module();
        wasm = {
            train: module.cwrap('train_ann', 'number', ['number', 'number', 'number', 'number']),
            predict: module.cwrap('run_ann', 'number', ['number', 'number']),
            malloc: module._malloc,
            free: module._free,
            HEAPF32: module.HEAPF32
        };
        updateStatus('[SYSTEM] WASM module initialized');
        
        // Hide loading indicator
        const loadingIndicator = document.getElementById('loadingIndicator');
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
        }
    } catch (error) {
        console.error('Failed to initialize WASM:', error);
        updateStatus('[ERROR] Failed to initialize WASM module');
        
        // Update loading indicator to show error
        const loadingIndicator = document.getElementById('loadingIndicator');
        if (loadingIndicator) {
            loadingIndicator.innerHTML = '<span style="color: #ff3333;">⚠️ Failed to initialize WASM</span>';
        }
    }
}

// CSV parsing and validation with mixed data type support
function parseCSV(fileContent) {
    const lines = fileContent.trim().split('\n');
    if (lines.length < 2) {
        return { error: 'CSV file must contain header and at least one data row' };
    }
    
    const headers = lines[0].split(',').map(h => h.trim());
    
    // Validate header pattern: x1, x2, ..., xN, y
    const inputHeaders = headers.slice(0, -1);
    const outputHeader = headers[headers.length - 1];
    
    if (outputHeader !== 'y') {
        return { error: 'Last column must be "y"' };
    }
    
    for (let i = 0; i < inputHeaders.length; i++) {
        if (inputHeaders[i] !== `x${i + 1}`) {
            return { error: `Column ${i + 1} must be "x${i + 1}", found "${inputHeaders[i]}"` };
        }
    }
    
    if (inputHeaders.length < 1 || inputHeaders.length > 10) {
        return { error: 'Must have 1-10 input columns (x1 to x10)' };
    }
    
    // Parse data rows (accept mixed types - strings and numbers)
    const rawData = [];
    for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim() === '') continue;
        
        const values = lines[i].split(',').map(v => v.trim());
        
        // Validate for empty values
        if (values.some(v => v === '')) {
            return { error: `Row ${i + 1} contains empty values. Please fill all cells.` };
        }
        
        if (values.length !== headers.length) {
            return { error: `Row ${i + 1} has incorrect number of columns (expected ${headers.length}, got ${values.length})` };
        }
        
        // Create row object with column names as keys
        const rowObject = {};
        headers.forEach((header, idx) => {
            rowObject[header] = values[idx];
        });
        
        rawData.push(rowObject);
    }
    
    if (rawData.length === 0) {
        return { error: 'No valid data rows found' };
    }
    
    // Create DataEncoder instance and encode the dataset
    const encoder = new DataEncoder();
    
    try {
        // Detect types and encode data
        encoder.detectTypes(rawData);
        const encodedData = encoder.encodeDataset(rawData);
        
        // Convert encoded data to flat arrays for WASM
        const inputs = [];
        const outputs = [];
        
        for (const row of encodedData) {
            // Add input features (all columns except 'y')
            for (const header of inputHeaders) {
                inputs.push(row[header]);
            }
            // Add output
            outputs.push(row['y']);
        }
        
        return {
            n_inputs: inputHeaders.length,
            inputs: inputs,
            outputs: outputs,
            n_rows: rawData.length,
            encoder: encoder,
            columnNames: inputHeaders,
            outputColumnName: 'y'
        };
        
    } catch (error) {
        return { error: `Encoding error: ${error.message}` };
    }
}

// Update status terminal
function updateStatus(message) {
    const terminal = document.getElementById('trainingStatus');
    const timestamp = new Date().toLocaleTimeString();
    const line = document.createElement('div');
    line.className = 'terminal-line';
    line.textContent = `[${timestamp}] ${message}`;
    terminal.appendChild(line);
    terminal.scrollTop = terminal.scrollHeight;
    
    // Add pulsing animation to terminal during training
    if (message.includes('[LEARNING]') || message.includes('[NEURAL]')) {
        terminal.classList.add('training-active');
    } else if (message.includes('[STATUS]') && message.includes('complete')) {
        terminal.classList.remove('training-active');
    }
}

// File upload handling
function handleFileUpload(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const result = parseCSV(e.target.result);
        const messageDiv = document.getElementById('validationMessage');
        
        if (result.error) {
            messageDiv.textContent = `⚠️ ${result.error}`;
            messageDiv.className = 'message error';
            document.getElementById('trainButton').disabled = true;
        } else {
            messageDiv.textContent = `✓ Valid CSV: ${result.n_rows} rows, ${result.n_inputs} inputs`;
            messageDiv.className = 'message success';
            document.getElementById('trainButton').disabled = false;
            parsedData = result;
            updateStatus(`[DATA] Loaded ${result.n_rows} samples with ${result.n_inputs} features`);
            
            // Display encoding summary if encoder is present
            if (result.encoder) {
                const summary = result.encoder.getEncodingSummary();
                updateStatus('[ENCODING] Data type detection complete:');
                
                // Display each line of the summary
                const summaryLines = summary.split('\n');
                summaryLines.forEach(line => {
                    if (line.trim()) {
                        updateStatus(`[ENCODING] ${line}`);
                    }
                });
            }
        }
    };
    reader.readAsText(file);
}

// Training execution
async function trainNetwork() {
    if (!parsedData || !wasm) {
        updateStatus('[ERROR] No data loaded or WASM not initialized');
        return;
    }
    
    const { n_inputs, inputs, outputs, n_rows } = parsedData;
    
    updateStatus('[CORE] Reanimation sequence initiated...');
    updateStatus('[LEARNING] Synaptic calibration in progress...');
    updateStatus(`[DATA] Training on ${n_rows} samples with ${n_inputs} features`);
    
    // Allocate WASM memory for inputs and outputs
    const inputsPtr = wasm.malloc(inputs.length * 4);  // 4 bytes per float
    const outputsPtr = wasm.malloc(outputs.length * 4);
    
    try {
        // Copy data to WASM heap
        wasm.HEAPF32.set(new Float32Array(inputs), inputsPtr / 4);
        wasm.HEAPF32.set(new Float32Array(outputs), outputsPtr / 4);
        
        updateStatus('[NEURAL] Initializing synaptic weights...');
        
        // Call training function
        const finalLoss = wasm.train(inputsPtr, outputsPtr, n_rows, n_inputs);
        
        updateStatus(`[STATUS] Training complete. Final loss: ${finalLoss.toFixed(6)}`);
        updateStatus('[CORE] Neural pathways established successfully');
        
        isNetworkTrained = true;
        generatePredictionInputs(n_inputs);
        displayNetworkConfig(n_inputs);
        
        // Show clear button
        document.getElementById('clearButton').style.display = 'inline-block';
        
    } catch (error) {
        updateStatus(`[ERROR] Training failed: ${error.message}`);
        console.error('Training error:', error);
    } finally {
        // Free allocated WASM memory
        wasm.free(inputsPtr);
        wasm.free(outputsPtr);
    }
}

// Generate prediction inputs
function generatePredictionInputs(n_inputs) {
    const container = document.getElementById('predictionInputs');
    container.innerHTML = '';
    
    const encoder = parsedData.encoder;
    const columnNames = parsedData.columnNames;
    
    for (let i = 0; i < n_inputs; i++) {
        const columnName = columnNames[i];
        const group = document.createElement('div');
        group.className = 'input-group';
        
        const label = document.createElement('label');
        label.textContent = `${columnName}:`;
        
        // Check if this column is categorical
        if (encoder && encoder.isCategorical(columnName)) {
            // Create dropdown for categorical features
            const select = document.createElement('select');
            select.id = `input_x${i + 1}`;
            
            // Add placeholder option
            const placeholderOption = document.createElement('option');
            placeholderOption.value = '';
            placeholderOption.textContent = '-- Select --';
            placeholderOption.disabled = true;
            placeholderOption.selected = true;
            select.appendChild(placeholderOption);
            
            // Add options for each categorical value
            const categoricalValues = encoder.getCategoricalValues(columnName);
            categoricalValues.forEach(value => {
                const option = document.createElement('option');
                option.value = value;
                option.textContent = value;
                select.appendChild(option);
            });
            
            group.appendChild(label);
            group.appendChild(select);
            
            // Add encoding hint next to categorical inputs
            const hint = document.createElement('span');
            hint.className = 'encoding-hint';
            const encodingMap = encoder.encodingMaps[columnName];
            const mappings = Object.entries(encodingMap)
                .map(([str, num]) => `${str}→${num}`)
                .join(', ');
            hint.textContent = ` (${mappings})`;
            hint.title = 'Encoding mapping used during training';
            group.appendChild(hint);
            
        } else {
            // Create a number input for numeric values
            const input = document.createElement('input');
            input.type = 'number';
            input.step = 'any';
            input.id = `input_x${i + 1}`;
            input.placeholder = `0.0`;
            
            group.appendChild(label);
            group.appendChild(input);
        }
        
        container.appendChild(group);
    }
    
    // Show prediction section with fade-in animation
    const predictionSection = document.getElementById('predictionSection');
    predictionSection.style.display = 'block';
    predictionSection.classList.add('fade-in');
}

// Display network configuration
function displayNetworkConfig(n_inputs) {
    const configDiv = document.getElementById('networkConfig');
    const n_hidden = 6; // Fixed in C implementation
    const n_outputs = 1; // Fixed in C implementation
    
    configDiv.innerHTML = `
        <strong>Network Architecture:</strong> 
        Input Layer: ${n_inputs} neurons | 
        Hidden Layer: ${n_hidden} neurons | 
        Output Layer: ${n_outputs} neuron
    `;
    configDiv.style.display = 'block';
}

// Clear and reset functionality
function clearAndReset() {
    // Reset state
    parsedData = null;
    isNetworkTrained = false;
    predictionHistory = [];
    
    // Reset UI
    document.getElementById('fileInput').value = '';
    document.getElementById('validationMessage').textContent = '';
    document.getElementById('validationMessage').className = 'message';
    document.getElementById('trainButton').disabled = true;
    document.getElementById('trainingStatus').innerHTML = '';
    document.getElementById('predictionSection').style.display = 'none';
    document.getElementById('networkConfig').style.display = 'none';
    document.getElementById('clearButton').style.display = 'none';
    document.getElementById('predictionOutput').textContent = '';
    
    updateStatus('[SYSTEM] Reset complete. Ready for new data.');
}

// Download prediction results
function downloadResults() {
    if (predictionHistory.length === 0) {
        updateStatus('[ERROR] No predictions to download');
        return;
    }
    
    // Create CSV content
    let csvContent = 'Prediction #,';
    for (let i = 1; i <= parsedData.n_inputs; i++) {
        csvContent += `x${i},`;
    }
    csvContent += 'Prediction (ŷ)\n';
    
    predictionHistory.forEach((record, index) => {
        csvContent += `${index + 1},${record.inputs.join(',')},${record.output}\n`;
    });
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'frankenstein_predictions.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    updateStatus(`[EXPORT] Downloaded ${predictionHistory.length} predictions`);
}

// Prediction execution
function makePrediction() {
    if (!isNetworkTrained || !parsedData || !wasm) {
        updateStatus('[ERROR] Network not trained or WASM not initialized');
        return;
    }
    
    const encoder = parsedData.encoder;
    const columnNames = parsedData.columnNames;
    
    // Collect and encode values from all prediction input fields
    const inputValues = [];
    const rawInputs = [];
    let hasUnknownValues = false;
    const unknownWarnings = [];
    
    for (let i = 0; i < parsedData.n_inputs; i++) {
        const columnName = columnNames[i];
        const inputElement = document.getElementById(`input_x${i + 1}`);
        const rawValue = inputElement.value.trim();
        
        if (rawValue === '') {
            updateStatus(`[ERROR] Please enter a value for ${columnName}`);
            return;
        }
        
        rawInputs.push(rawValue);
        
        // Encode the value using the encoder
        if (encoder && encoder.isCategorical(columnName)) {
            const encodedValue = encoder.encodeValue(columnName, rawValue);
            
            // Check for unknown categorical values
            if (encodedValue === null) {
                hasUnknownValues = true;
                const validValues = encoder.getCategoricalValues(columnName);
                unknownWarnings.push(
                    `⚠️ "${rawValue}" is not a known value for ${columnName}. Valid values: ${validValues.join(', ')}`
                );
                // Use 0 as fallback for unknown values
                inputValues.push(0);
            } else {
                inputValues.push(encodedValue);
            }
        } else {
            // Numeric column - parse as number
            const numValue = parseFloat(rawValue);
            if (isNaN(numValue)) {
                updateStatus(`[ERROR] Please enter a valid number for ${columnName}`);
                return;
            }
            inputValues.push(numValue);
        }
    }
    
    // Display warnings for unknown categorical values
    if (hasUnknownValues) {
        unknownWarnings.forEach(warning => updateStatus(warning));
        updateStatus('[WARNING] Prediction may be inaccurate due to unknown categorical values');
    }
    
    // Allocate WASM memory for input array
    const inputPtr = wasm.malloc(inputValues.length * 4);  // 4 bytes per float
    
    try {
        // Copy input values to WASM heap
        wasm.HEAPF32.set(new Float32Array(inputValues), inputPtr / 4);
        
        // Call run_ann function
        const prediction = wasm.predict(inputPtr, inputValues.length);
        
        // Decode output if it's categorical
        let displayValue;
        let decodedOutput = null;
        
        if (encoder && encoder.isCategorical(parsedData.outputColumnName)) {
            decodedOutput = encoder.decodeValue(parsedData.outputColumnName, prediction);
            displayValue = `${decodedOutput} (confidence: ${prediction.toFixed(4)})`;
        } else {
            displayValue = prediction.toFixed(4);
        }
        
        // Store prediction in history
        predictionHistory.push({
            inputs: [...rawInputs],
            encodedInputs: [...inputValues],
            output: decodedOutput !== null ? decodedOutput : prediction.toFixed(4),
            rawOutput: prediction
        });
        
        // Display prediction result with animation
        const output = document.getElementById('predictionOutput');
        output.textContent = `ŷ = ${displayValue}`;
        output.classList.add('reveal');
        
        // Remove animation class after it completes
        setTimeout(() => output.classList.remove('reveal'), 600);
        
        updateStatus(`[PREDICT] Input: [${rawInputs.join(', ')}] → Output: ${displayValue}`);
        
    } catch (error) {
        updateStatus(`[ERROR] Prediction failed: ${error.message}`);
        console.error('Prediction error:', error);
    } finally {
        // Free allocated WASM memory
        wasm.free(inputPtr);
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Wait for Module to be available (it's loaded from neurobrain.js)
    if (typeof Module === 'undefined') {
        console.error('Module not found - ensure neurobrain.js is loaded first');
        updateStatus('[ERROR] WASM module not found');
        return;
    }
    initWASM();
    
    const fileInput = document.getElementById('fileInput');
    const uploadArea = document.getElementById('uploadArea');
    
    // File input change
    fileInput.addEventListener('change', function(e) {
        if (e.target.files.length > 0) {
            handleFileUpload(e.target.files[0]);
        }
    });
    
    // Click to upload
    uploadArea.addEventListener('click', function() {
        fileInput.click();
    });
    
    // Drag and drop
    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        uploadArea.style.background = 'rgba(0, 255, 65, 0.1)';
    });
    
    uploadArea.addEventListener('dragleave', function() {
        uploadArea.style.background = '';
    });
    
    uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        uploadArea.style.background = '';
        if (e.dataTransfer.files.length > 0) {
            handleFileUpload(e.dataTransfer.files[0]);
        }
    });
    
    // Train button
    document.getElementById('trainButton').addEventListener('click', trainNetwork);
    
    // Predict button
    document.getElementById('predictButton').addEventListener('click', makePrediction);
    
    // Clear button
    document.getElementById('clearButton').addEventListener('click', clearAndReset);
    
    // Download button
    document.getElementById('downloadButton').addEventListener('click', downloadResults);
    
    // Instructions toggle
    const toggleInstructions = document.getElementById('toggleInstructions');
    const instructionsContent = document.getElementById('instructionsContent');
    const toggleIcon = toggleInstructions.querySelector('.toggle-icon');
    
    toggleInstructions.addEventListener('click', () => {
        if (instructionsContent.style.display === 'none') {
            instructionsContent.style.display = 'block';
            toggleInstructions.innerHTML = '<span class="toggle-icon rotated">▼</span> Hide Instructions';
        } else {
            instructionsContent.style.display = 'none';
            toggleInstructions.innerHTML = '<span class="toggle-icon">▼</span> Show Instructions';
        }
    });
    
    // Example dataset downloads
    const exampleDatasets = {
        numeric: `size,bedrooms,price
1200,2,250000
1800,3,350000
2400,4,450000
1500,2,280000
2000,3,380000
900,1,180000
3000,5,550000
1600,3,320000
2200,4,420000
1400,2,270000`,
        
        categorical: `color,size,fruit
red,small,apple
yellow,medium,banana
orange,medium,orange
red,large,apple
yellow,large,banana
green,small,apple
orange,small,orange
yellow,small,banana
red,medium,apple
green,medium,apple`,
        
        mixed: `age,membership,income,purchased
25,bronze,45000,no
35,gold,75000,yes
45,silver,60000,yes
22,bronze,35000,no
50,gold,95000,yes
28,silver,50000,no
40,gold,85000,yes
33,bronze,42000,no
48,silver,68000,yes
26,gold,72000,yes`
    };
    
    document.querySelectorAll('.download-example').forEach(button => {
        button.addEventListener('click', (e) => {
            const exampleType = e.target.getAttribute('data-example');
            const csvContent = exampleDatasets[exampleType];
            
            // Create blob and download
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `example_${exampleType}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            updateStatus(`[SYSTEM] Downloaded example_${exampleType}.csv`);
        });
    });
});
