// Web interface logic and WASM integration

let wasm = null;
let parsedData = null;
let isNetworkTrained = false;
let predictionHistory = [];
let lossGraph = null;

// LossGraph class for visualizing training loss over epochs
class LossGraph {
    constructor(canvasId, width, height) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.error(`Canvas with id "${canvasId}" not found`);
            return;
        }
        this.ctx = this.canvas.getContext('2d');
        this.width = width;
        this.height = height;
        this.lossHistory = [];
        this.maxLoss = 1.0;
        this.minLoss = 0.0;
        
        // Padding for axes and labels
        this.padding = {
            left: 60,
            right: 20,
            top: 20,
            bottom: 50
        };
        
        // Colors matching Frankenstein theme
        this.colors = {
            background: '#1a1a1a',
            grid: 'rgba(0, 255, 65, 0.1)',
            axis: '#00ff41',
            curve: '#00ff41',
            text: '#00ff41'
        };
    }
    
    addDataPoint(epoch, loss) {
        this.lossHistory.push({ epoch, loss });
        this.maxLoss = Math.max(this.maxLoss, loss);
        this.minLoss = Math.min(this.minLoss, loss);
    }
    
    render() {
        if (!this.ctx || this.lossHistory.length === 0) return;
        
        // Clear canvas with background color
        this.ctx.fillStyle = this.colors.background;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Calculate plot area dimensions
        const plotWidth = this.width - this.padding.left - this.padding.right;
        const plotHeight = this.height - this.padding.top - this.padding.bottom;
        const plotX = this.padding.left;
        const plotY = this.padding.top;
        
        // Draw grid lines
        this.drawGrid(plotX, plotY, plotWidth, plotHeight);
        
        // Draw axes
        this.drawAxes(plotX, plotY, plotWidth, plotHeight);
        
        // Draw loss curve
        this.drawCurve(plotX, plotY, plotWidth, plotHeight);
        
        // Draw axis labels and scale markers
        this.drawLabels(plotX, plotY, plotWidth, plotHeight);
    }
    
    drawGrid(x, y, width, height) {
        this.ctx.strokeStyle = this.colors.grid;
        this.ctx.lineWidth = 1;
        
        // Vertical grid lines (5 divisions)
        for (let i = 0; i <= 5; i++) {
            const gridX = x + (width * i / 5);
            this.ctx.beginPath();
            this.ctx.moveTo(gridX, y);
            this.ctx.lineTo(gridX, y + height);
            this.ctx.stroke();
        }
        
        // Horizontal grid lines (5 divisions)
        for (let i = 0; i <= 5; i++) {
            const gridY = y + (height * i / 5);
            this.ctx.beginPath();
            this.ctx.moveTo(x, gridY);
            this.ctx.lineTo(x + width, gridY);
            this.ctx.stroke();
        }
    }
    
    drawAxes(x, y, width, height) {
        this.ctx.strokeStyle = this.colors.axis;
        this.ctx.lineWidth = 2;
        
        // Y-axis
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(x, y + height);
        this.ctx.stroke();
        
        // X-axis
        this.ctx.beginPath();
        this.ctx.moveTo(x, y + height);
        this.ctx.lineTo(x + width, y + height);
        this.ctx.stroke();
    }
    
    drawCurve(x, y, width, height) {
        if (this.lossHistory.length < 2) return;
        
        const maxEpoch = this.lossHistory[this.lossHistory.length - 1].epoch;
        const lossRange = this.maxLoss - this.minLoss;
        
        // Ensure we have a valid range
        const effectiveRange = lossRange > 0 ? lossRange : 1.0;
        
        this.ctx.strokeStyle = this.colors.curve;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        
        // Plot each point
        for (let i = 0; i < this.lossHistory.length; i++) {
            const point = this.lossHistory[i];
            
            // Normalize coordinates to plot area
            const plotX = x + (point.epoch / maxEpoch) * width;
            const plotY = y + height - ((point.loss - this.minLoss) / effectiveRange) * height;
            
            if (i === 0) {
                this.ctx.moveTo(plotX, plotY);
            } else {
                this.ctx.lineTo(plotX, plotY);
            }
        }
        
        this.ctx.stroke();
    }
    
    drawLabels(x, y, width, height) {
        this.ctx.fillStyle = this.colors.text;
        this.ctx.font = '12px monospace';
        this.ctx.textAlign = 'center';
        
        // X-axis label
        this.ctx.fillText('Epoch', x + width / 2, y + height + 35);
        
        // Y-axis label (rotated)
        this.ctx.save();
        this.ctx.translate(15, y + height / 2);
        this.ctx.rotate(-Math.PI / 2);
        this.ctx.fillText('Loss', 0, 0);
        this.ctx.restore();
        
        // X-axis scale markers
        const maxEpoch = this.lossHistory.length > 0 
            ? this.lossHistory[this.lossHistory.length - 1].epoch 
            : 300;
        
        this.ctx.textAlign = 'center';
        for (let i = 0; i <= 5; i++) {
            const epoch = Math.round((maxEpoch * i) / 5);
            const markerX = x + (width * i / 5);
            this.ctx.fillText(epoch.toString(), markerX, y + height + 20);
        }
        
        // Y-axis scale markers
        this.ctx.textAlign = 'right';
        for (let i = 0; i <= 5; i++) {
            const lossValue = this.maxLoss - ((this.maxLoss - this.minLoss) * i / 5);
            const markerY = y + (height * i / 5);
            this.ctx.fillText(lossValue.toFixed(3), x - 10, markerY + 4);
        }
    }
    
    clear() {
        this.lossHistory = [];
        this.maxLoss = 1.0;
        this.minLoss = 0.0;
        
        if (this.ctx) {
            this.ctx.fillStyle = this.colors.background;
            this.ctx.fillRect(0, 0, this.width, this.height);
        }
    }
}

// WeightHeatmap class for visualizing network weights
class WeightHeatmap {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.error(`Canvas with id "${canvasId}" not found`);
            return;
        }
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        // Padding for title and legend
        this.padding = {
            top: 40,
            bottom: 60,
            left: 10,
            right: 10
        };
        
        // Colors matching Frankenstein theme
        this.colors = {
            background: '#1a1a1a',
            border: '#0a0a0a',
            text: '#00ff41',
            cellBorder: '#1a1a1a'
        };
    }
    
    render(weights, rows, cols, title) {
        if (!this.ctx || !weights || weights.length === 0) {
            console.error('Invalid weights data for heatmap');
            return;
        }
        
        // Clear canvas with background color
        this.ctx.fillStyle = this.colors.background;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Calculate available space for heatmap
        const availableWidth = this.width - this.padding.left - this.padding.right;
        const availableHeight = this.height - this.padding.top - this.padding.bottom;
        
        // Calculate cell dimensions
        const cellWidth = availableWidth / cols;
        const cellHeight = availableHeight / rows;
        
        // Find min/max for color scaling
        const minWeight = Math.min(...weights);
        const maxWeight = Math.max(...weights);
        const absMax = Math.max(Math.abs(minWeight), Math.abs(maxWeight));
        
        // Draw each weight as colored rectangle
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const weight = weights[r * cols + c];
                const color = this.weightToColor(weight, absMax);
                
                const x = this.padding.left + c * cellWidth;
                const y = this.padding.top + r * cellHeight;
                
                // Fill cell with color
                this.ctx.fillStyle = color;
                this.ctx.fillRect(x, y, cellWidth, cellHeight);
                
                // Draw border
                this.ctx.strokeStyle = this.colors.cellBorder;
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(x, y, cellWidth, cellHeight);
            }
        }
        
        // Draw title
        this.drawTitle(title);
        
        // Draw color scale legend
        this.drawColorScale(absMax);
    }
    
    weightToColor(weight, absMax) {
        // Handle edge case where all weights are zero
        if (absMax === 0) {
            return 'rgb(255, 255, 255)';
        }
        
        // Normalize to [-1, 1]
        const normalized = weight / absMax;
        
        // Blue (negative) → White (zero) → Red (positive)
        if (normalized < 0) {
            const intensity = Math.abs(normalized);
            const r = Math.floor(255 * (1 - intensity));
            const g = Math.floor(255 * (1 - intensity));
            const b = 255;
            return `rgb(${r}, ${g}, ${b})`;
        } else {
            const intensity = normalized;
            const r = 255;
            const g = Math.floor(255 * (1 - intensity));
            const b = Math.floor(255 * (1 - intensity));
            return `rgb(${r}, ${g}, ${b})`;
        }
    }
    
    drawTitle(title) {
        this.ctx.fillStyle = this.colors.text;
        this.ctx.font = 'bold 14px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(title, this.width / 2, 20);
    }
    
    drawColorScale(absMax) {
        const legendWidth = 200;
        const legendHeight = 20;
        const legendX = (this.width - legendWidth) / 2;
        const legendY = this.height - 35;
        
        // Draw gradient bar
        const gradient = this.ctx.createLinearGradient(legendX, legendY, legendX + legendWidth, legendY);
        gradient.addColorStop(0, 'rgb(0, 0, 255)');      // Blue (negative)
        gradient.addColorStop(0.5, 'rgb(255, 255, 255)'); // White (zero)
        gradient.addColorStop(1, 'rgb(255, 0, 0)');       // Red (positive)
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(legendX, legendY, legendWidth, legendHeight);
        
        // Draw border around gradient
        this.ctx.strokeStyle = this.colors.text;
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(legendX, legendY, legendWidth, legendHeight);
        
        // Draw scale labels
        this.ctx.fillStyle = this.colors.text;
        this.ctx.font = '11px monospace';
        this.ctx.textAlign = 'center';
        
        // Left label (negative)
        this.ctx.textAlign = 'right';
        this.ctx.fillText(`-${absMax.toFixed(2)}`, legendX - 5, legendY + 15);
        
        // Center label (zero)
        this.ctx.textAlign = 'center';
        this.ctx.fillText('0', legendX + legendWidth / 2, legendY + 15);
        
        // Right label (positive)
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`+${absMax.toFixed(2)}`, legendX + legendWidth + 5, legendY + 15);
    }
    
    setupHoverTooltip(weights, rows, cols) {
        // Calculate cell dimensions
        const availableWidth = this.width - this.padding.left - this.padding.right;
        const availableHeight = this.height - this.padding.top - this.padding.bottom;
        const cellWidth = availableWidth / cols;
        const cellHeight = availableHeight / rows;
        
        // Create tooltip element if it doesn't exist
        let tooltip = document.getElementById('weight-tooltip');
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.id = 'weight-tooltip';
            tooltip.style.position = 'absolute';
            tooltip.style.display = 'none';
            tooltip.style.background = 'rgba(0, 0, 0, 0.9)';
            tooltip.style.color = '#00ff41';
            tooltip.style.padding = '5px 10px';
            tooltip.style.borderRadius = '4px';
            tooltip.style.border = '1px solid #00ff41';
            tooltip.style.fontSize = '12px';
            tooltip.style.fontFamily = 'monospace';
            tooltip.style.pointerEvents = 'none';
            tooltip.style.zIndex = '1000';
            document.body.appendChild(tooltip);
        }
        
        // Add mousemove event listener
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Check if mouse is within heatmap area
            if (x < this.padding.left || x > this.width - this.padding.right ||
                y < this.padding.top || y > this.height - this.padding.bottom) {
                tooltip.style.display = 'none';
                return;
            }
            
            // Calculate cell position
            const col = Math.floor((x - this.padding.left) / cellWidth);
            const row = Math.floor((y - this.padding.top) / cellHeight);
            
            if (row >= 0 && row < rows && col >= 0 && col < cols) {
                const weight = weights[row * cols + col];
                tooltip.textContent = `[${row},${col}]: ${weight.toFixed(4)}`;
                tooltip.style.display = 'block';
                tooltip.style.left = (e.clientX + 10) + 'px';
                tooltip.style.top = (e.clientY + 10) + 'px';
            } else {
                tooltip.style.display = 'none';
            }
        });
        
        // Hide tooltip when mouse leaves canvas
        this.canvas.addEventListener('mouseleave', () => {
            tooltip.style.display = 'none';
        });
    }
    
    clear() {
        if (this.ctx) {
            this.ctx.fillStyle = this.colors.background;
            this.ctx.fillRect(0, 0, this.width, this.height);
        }
    }
}

// Pre-loaded datasets for immediate experimentation
const PRELOADED_DATASETS = {
    xor: {
        name: "XOR Problem",
        description: "Classic 2-input XOR logic gate (4 samples)",
        data: {
            inputs: [0, 0, 0, 1, 1, 0, 1, 1],
            outputs: [0, 1, 1, 0],
            n_inputs: 2,
            n_rows: 4
        },
        featureNames: ["x1", "x2"]
    },
    
    linear_regression: {
        name: "Simple Linear Regression",
        description: "1-input linear relationship: y = 2x + 1 (10 samples)",
        data: {
            inputs: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
            outputs: [1, 3, 5, 7, 9, 11, 13, 15, 17, 19],
            n_inputs: 1,
            n_rows: 10
        },
        featureNames: ["x1"]
    },
    
    iris_setosa: {
        name: "Iris Setosa Classification",
        description: "4 features: sepal length, sepal width, petal length, petal width (50 samples, binary classification)",
        data: {
            // Raw Iris data: 25 setosa samples (label=1) + 25 non-setosa samples (label=0)
            // Features: sepal_length, sepal_width, petal_length, petal_width (in cm)
            rawSamples: [
                // Setosa samples (label = 1)
                [5.1, 3.5, 1.4, 0.2, 1], [4.9, 3.0, 1.4, 0.2, 1], [4.7, 3.2, 1.3, 0.2, 1],
                [4.6, 3.1, 1.5, 0.2, 1], [5.0, 3.6, 1.4, 0.2, 1], [5.4, 3.9, 1.7, 0.4, 1],
                [4.6, 3.4, 1.4, 0.3, 1], [5.0, 3.4, 1.5, 0.2, 1], [4.4, 2.9, 1.4, 0.2, 1],
                [4.9, 3.1, 1.5, 0.1, 1], [5.4, 3.7, 1.5, 0.2, 1], [4.8, 3.4, 1.6, 0.2, 1],
                [4.8, 3.0, 1.4, 0.1, 1], [4.3, 3.0, 1.1, 0.1, 1], [5.8, 4.0, 1.2, 0.2, 1],
                [5.7, 4.4, 1.5, 0.4, 1], [5.4, 3.9, 1.3, 0.4, 1], [5.1, 3.5, 1.4, 0.3, 1],
                [5.7, 3.8, 1.7, 0.3, 1], [5.1, 3.8, 1.5, 0.3, 1], [5.4, 3.4, 1.7, 0.2, 1],
                [5.1, 3.7, 1.5, 0.4, 1], [4.6, 3.6, 1.0, 0.2, 1], [5.1, 3.3, 1.7, 0.5, 1],
                [4.8, 3.4, 1.9, 0.2, 1],
                // Non-setosa samples (versicolor and virginica, label = 0)
                [7.0, 3.2, 4.7, 1.4, 0], [6.4, 3.2, 4.5, 1.5, 0], [6.9, 3.1, 4.9, 1.5, 0],
                [5.5, 2.3, 4.0, 1.3, 0], [6.5, 2.8, 4.6, 1.5, 0], [5.7, 2.8, 4.5, 1.3, 0],
                [6.3, 3.3, 4.7, 1.6, 0], [4.9, 2.4, 3.3, 1.0, 0], [6.6, 2.9, 4.6, 1.3, 0],
                [5.2, 2.7, 3.9, 1.4, 0], [5.0, 2.0, 3.5, 1.0, 0], [5.9, 3.0, 4.2, 1.5, 0],
                [6.0, 2.2, 4.0, 1.0, 0], [6.1, 2.9, 4.7, 1.4, 0], [5.6, 2.9, 3.6, 1.3, 0],
                [6.7, 3.1, 4.4, 1.4, 0], [5.6, 3.0, 4.5, 1.5, 0], [5.8, 2.7, 4.1, 1.0, 0],
                [6.2, 2.2, 4.5, 1.5, 0], [5.6, 2.5, 3.9, 1.1, 0], [5.9, 3.2, 4.8, 1.8, 0],
                [6.1, 2.8, 4.0, 1.3, 0], [6.3, 2.5, 4.9, 1.5, 0], [6.1, 2.8, 4.7, 1.2, 0],
                [6.4, 2.9, 4.3, 1.3, 0]
            ],
            n_inputs: 4,
            n_rows: 50
        },
        featureNames: ["Sepal Length", "Sepal Width", "Petal Length", "Petal Width"],
        needsNormalization: true
    }
};

// Normalize Iris dataset features to [0,1] range
function normalizeIrisData(rawSamples) {
    const n_features = 4;
    const n_samples = rawSamples.length;
    
    // Calculate min and max for each feature
    const stats = [];
    for (let f = 0; f < n_features; f++) {
        const featureValues = rawSamples.map(sample => sample[f]);
        stats.push({
            min: Math.min(...featureValues),
            max: Math.max(...featureValues)
        });
    }
    
    // Normalize each sample
    const normalizedInputs = [];
    const outputs = [];
    
    for (let i = 0; i < n_samples; i++) {
        for (let f = 0; f < n_features; f++) {
            const { min, max } = stats[f];
            const normalized = (rawSamples[i][f] - min) / (max - min);
            normalizedInputs.push(normalized);
        }
        // Extract label (last element)
        outputs.push(rawSamples[i][n_features]);
    }
    
    return {
        inputs: normalizedInputs,
        outputs: outputs,
        stats: stats
    };
}

// Initialize WASM module
async function initWASM() {
    try {
        // Module is a factory function that returns a Promise when MODULARIZE=1
        const module = await Module();
        
        // Feature detection: check if train_ann_v2 is available
        const hasV2 = typeof module._train_ann_v2 !== 'undefined';
        const hasGetWeights = typeof module._get_weights !== 'undefined';
        
        wasm = {
            train: module.cwrap('train_ann', 'number', ['number', 'number', 'number', 'number']),
            train_v2: hasV2 ? module.cwrap('train_ann_v2', 'number', ['number', 'number', 'number', 'number', 'number', 'number', 'number']) : null,
            predict: module.cwrap('run_ann', 'number', ['number', 'number']),
            get_weights: hasGetWeights ? module.cwrap('get_weights', null, ['number', 'number']) : null,
            malloc: module._malloc,
            free: module._free,
            HEAPF32: module.HEAPF32,
            hasV2Features: hasV2 && hasGetWeights
        };
        
        // Log feature availability
        if (wasm.hasV2Features) {
            updateStatus('[SYSTEM] WASM module initialized with v2 features (configurable architecture, visualizations)');
        } else {
            updateStatus('[SYSTEM] WASM module initialized with v1 features (basic training only)');
            updateStatus('[INFO] Advanced features (ReLU, Tanh, configurable hidden layers, visualizations) not available');
        }
        
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
            document.getElementById('configControls').style.display = 'none';
        } else {
            messageDiv.textContent = `✓ Valid CSV: ${result.n_rows} rows, ${result.n_inputs} inputs`;
            messageDiv.className = 'message success';
            document.getElementById('trainButton').disabled = false;
            
            // Only show config controls if v2 features are available
            if (wasm && wasm.hasV2Features) {
                document.getElementById('configControls').style.display = 'block';
            }
            
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

// Visualize network weights after training
function visualizeWeights(n_inputs, n_hidden) {
    if (!wasm || !wasm.get_weights) {
        updateStatus('[ERROR] Weight extraction not available');
        return;
    }
    
    const startTime = performance.now();
    
    // Calculate sizes for weight matrices
    const weightsIHSize = n_inputs * n_hidden;  // Input-to-hidden weights
    const weightsHOSize = n_hidden * 1;         // Hidden-to-output weights (always 1 output)
    
    // Allocate memory for weight matrices
    const weightsIHPtr = wasm.malloc(weightsIHSize * 4);  // 4 bytes per float
    const weightsHOPtr = wasm.malloc(weightsHOSize * 4);
    
    try {
        // Call get_weights to copy weights from WASM
        wasm.get_weights(weightsIHPtr, weightsHOPtr);
        
        // Copy weights from WASM heap to JavaScript arrays
        const weightsIH = new Float32Array(wasm.HEAPF32.buffer, weightsIHPtr, weightsIHSize);
        const weightsHO = new Float32Array(wasm.HEAPF32.buffer, weightsHOPtr, weightsHOSize);
        
        // Create copies since the WASM memory will be freed
        const weightsIHCopy = Array.from(weightsIH);
        const weightsHOCopy = Array.from(weightsHO);
        
        // Create WeightHeatmap instances and render
        const heatmapIH = new WeightHeatmap('weightsIHCanvas');
        const heatmapHO = new WeightHeatmap('weightsHOCanvas');
        
        // Render input-to-hidden weights (rows=hidden neurons, cols=input features)
        heatmapIH.render(weightsIHCopy, n_hidden, n_inputs, 'Input → Hidden Weights');
        heatmapIH.setupHoverTooltip(weightsIHCopy, n_hidden, n_inputs);
        
        // Render hidden-to-output weights (rows=output neurons, cols=hidden neurons)
        heatmapHO.render(weightsHOCopy, 1, n_hidden, 'Hidden → Output Weights');
        heatmapHO.setupHoverTooltip(weightsHOCopy, 1, n_hidden);
        
        // Show weight heatmap container
        const weightHeatmapContainer = document.getElementById('weightHeatmapContainer');
        weightHeatmapContainer.style.display = 'block';
        
        const endTime = performance.now();
        const renderTime = endTime - startTime;
        
        updateStatus(`[VISUAL] Weight heatmaps rendered in ${renderTime.toFixed(1)}ms`);
        
    } catch (error) {
        updateStatus(`[ERROR] Weight visualization failed: ${error.message}`);
        console.error('Weight visualization error:', error);
    } finally {
        // Free allocated WASM memory
        wasm.free(weightsIHPtr);
        wasm.free(weightsHOPtr);
    }
}

// Calculate accuracy for Iris dataset
function calculateIrisAccuracy(inputsPtr, outputsPtr, n_rows, n_inputs) {
    if (!wasm || !wasm.predict) {
        console.error('WASM predict function not available');
        return 0;
    }
    
    let correctPredictions = 0;
    const threshold = 0.5; // Binary classification threshold
    
    // Allocate memory for a single input sample
    const singleInputPtr = wasm.malloc(n_inputs * 4);
    
    try {
        // Test each sample in the training set
        for (let i = 0; i < n_rows; i++) {
            // Copy single sample from training data
            const inputOffset = i * n_inputs;
            for (let j = 0; j < n_inputs; j++) {
                const value = wasm.HEAPF32[(inputsPtr / 4) + inputOffset + j];
                wasm.HEAPF32[(singleInputPtr / 4) + j] = value;
            }
            
            // Get prediction
            const prediction = wasm.predict(singleInputPtr, n_inputs);
            
            // Get actual label
            const actualLabel = wasm.HEAPF32[(outputsPtr / 4) + i];
            
            // Convert prediction to binary (0 or 1) using threshold
            const predictedLabel = prediction >= threshold ? 1 : 0;
            const actualBinaryLabel = actualLabel >= threshold ? 1 : 0;
            
            // Check if prediction matches actual label
            if (predictedLabel === actualBinaryLabel) {
                correctPredictions++;
            }
        }
    } finally {
        wasm.free(singleInputPtr);
    }
    
    // Calculate accuracy percentage
    const accuracy = (correctPredictions / n_rows) * 100;
    return accuracy;
}

// Display accuracy with threshold validation
function displayAccuracy(accuracy) {
    const accuracyDisplay = document.getElementById('accuracyDisplay');
    const threshold = 90.0; // Required accuracy threshold
    
    // Format accuracy message
    let message = `Accuracy: ${accuracy.toFixed(2)}%`;
    
    // Add threshold validation indicator
    if (accuracy >= threshold) {
        message += ` ✓ (meets ${threshold}% threshold)`;
        accuracyDisplay.style.color = '#00ff41'; // Green for success
    } else {
        message += ` ⚠️ (below ${threshold}% threshold)`;
        accuracyDisplay.style.color = '#ffaa00'; // Orange for warning
    }
    
    accuracyDisplay.textContent = message;
    accuracyDisplay.style.display = 'block';
    
    // Log to status terminal
    updateStatus(`[ACCURACY] ${message}`);
    
    // Verify accuracy meets requirement
    if (accuracy >= threshold) {
        updateStatus(`[VALIDATION] Iris classification accuracy requirement satisfied`);
    } else {
        updateStatus(`[VALIDATION] Warning: Accuracy below required ${threshold}% threshold`);
    }
}

// Training execution
async function trainNetwork() {
    if (!parsedData || !wasm) {
        updateStatus('[ERROR] No data loaded or WASM not initialized');
        return;
    }
    
    const { n_inputs, inputs, outputs, n_rows } = parsedData;
    
    // Check if v2 features are available
    const useV2 = wasm.hasV2Features && wasm.train_v2;
    
    // Get configuration parameters (only used if v2 is available)
    const activationType = useV2 ? parseInt(document.getElementById('activationSelect').value) : 0;
    const hiddenSize = useV2 ? parseInt(document.getElementById('hiddenSizeSlider').value) : 6;
    
    // Get activation function name for display
    const activationNames = ['Sigmoid', 'ReLU', 'Tanh'];
    const activationName = activationNames[activationType];
    
    updateStatus('[CORE] Reanimation sequence initiated...');
    updateStatus('[LEARNING] Synaptic calibration in progress...');
    updateStatus(`[DATA] Training on ${n_rows} samples with ${n_inputs} features`);
    
    if (useV2) {
        updateStatus(`[CONFIG] Hidden neurons: ${hiddenSize}, Activation: ${activationName}`);
    } else {
        updateStatus(`[CONFIG] Hidden neurons: 6 (fixed), Activation: Sigmoid (v1 mode)`);
    }
    
    // Allocate WASM memory for inputs and outputs
    const inputsPtr = wasm.malloc(inputs.length * 4);  // 4 bytes per float
    const outputsPtr = wasm.malloc(outputs.length * 4);
    
    let lossHistoryPtr = null;
    const epochs = 300;
    
    // Only allocate loss history if v2 is available
    if (useV2) {
        lossHistoryPtr = wasm.malloc(epochs * 4);  // Store loss for each epoch
        
        // Initialize loss graph and clear previous data
        if (!lossGraph) {
            lossGraph = new LossGraph('lossGraphCanvas', 600, 300);
        }
        lossGraph.clear();
        
        // Show loss graph container
        const lossGraphContainer = document.getElementById('lossGraphContainer');
        lossGraphContainer.style.display = 'block';
    }
    
    try {
        // Copy data to WASM heap
        wasm.HEAPF32.set(new Float32Array(inputs), inputsPtr / 4);
        wasm.HEAPF32.set(new Float32Array(outputs), outputsPtr / 4);
        
        updateStatus('[NEURAL] Initializing synaptic weights...');
        
        let finalLoss;
        
        if (useV2) {
            // Call training function v2 with configuration parameters
            finalLoss = wasm.train_v2(inputsPtr, outputsPtr, n_rows, n_inputs, 
                                            hiddenSize, activationType, lossHistoryPtr);
            
            // Check for error codes
            if (finalLoss < 0) {
                const errorMessages = {
                    '-1': 'Invalid input size (must be 1-10)',
                    '-2': 'Invalid hidden layer size (must be 2-20)',
                    '-3': 'Invalid activation type (must be 0-2)',
                    '-4': 'Invalid number of rows'
                };
                const errorMsg = errorMessages[finalLoss.toString()] || 'Unknown error';
                updateStatus(`[ERROR] Training failed: ${errorMsg}`);
                return;
            }
            
            // Copy loss history from WASM heap and update graph
            const lossHistoryArray = new Float32Array(wasm.HEAPF32.buffer, lossHistoryPtr, epochs);
            for (let epoch = 0; epoch < epochs; epoch++) {
                lossGraph.addDataPoint(epoch, lossHistoryArray[epoch]);
            }
            
            // Render the complete loss graph
            lossGraph.render();
            
            // Display final loss value
            const finalLossDisplay = document.getElementById('finalLossDisplay');
            finalLossDisplay.textContent = `Final Loss: ${finalLoss.toFixed(6)}`;
            finalLossDisplay.style.display = 'block';
        } else {
            // Fallback to v1 training function (no configuration, no loss history)
            updateStatus('[INFO] Using v1 training (no loss visualization available)');
            finalLoss = wasm.train(inputsPtr, outputsPtr, n_rows, n_inputs);
            
            if (finalLoss < 0) {
                updateStatus(`[ERROR] Training failed with error code: ${finalLoss}`);
                return;
            }
        }
        
        updateStatus(`[STATUS] Training complete. Final loss: ${finalLoss.toFixed(6)}`);
        updateStatus('[CORE] Neural pathways established successfully');
        
        // Calculate and display accuracy for Iris dataset (only if v2 available)
        if (useV2 && parsedData.datasetName === 'Iris Setosa Classification') {
            const accuracy = calculateIrisAccuracy(inputsPtr, outputsPtr, n_rows, n_inputs);
            displayAccuracy(accuracy);
        }
        
        isNetworkTrained = true;
        generatePredictionInputs(n_inputs);
        displayNetworkConfig(n_inputs, hiddenSize, activationName);
        
        // Visualize weights after training (only if v2 available)
        if (useV2) {
            visualizeWeights(n_inputs, hiddenSize);
        } else {
            updateStatus('[INFO] Weight visualization not available in v1 mode');
        }
        
        // Show clear button
        document.getElementById('clearButton').style.display = 'inline-block';
        
    } catch (error) {
        updateStatus(`[ERROR] Training failed: ${error.message}`);
        console.error('Training error:', error);
    } finally {
        // Free allocated WASM memory
        wasm.free(inputsPtr);
        wasm.free(outputsPtr);
        if (lossHistoryPtr !== null) {
            wasm.free(lossHistoryPtr);
        }
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
function displayNetworkConfig(n_inputs, n_hidden, activationName) {
    const configDiv = document.getElementById('networkConfig');
    const n_outputs = 1; // Fixed in C implementation
    
    configDiv.innerHTML = `
        <strong>Network Architecture:</strong> 
        Input Layer: ${n_inputs} neurons | 
        Hidden Layer: ${n_hidden} neurons (${activationName}) | 
        Output Layer: ${n_outputs} neuron (Sigmoid)
    `;
    configDiv.style.display = 'block';
}

// Clear and reset functionality
function clearAndReset() {
    // Reset state
    parsedData = null;
    isNetworkTrained = false;
    predictionHistory = [];
    
    // Clear loss graph
    if (lossGraph) {
        lossGraph.clear();
    }
    
    // Reset UI
    document.getElementById('fileInput').value = '';
    document.getElementById('datasetSelect').value = '';
    document.getElementById('datasetInfo').style.display = 'none';
    document.getElementById('loadDatasetButton').disabled = true;
    document.getElementById('validationMessage').textContent = '';
    document.getElementById('validationMessage').className = 'message';
    document.getElementById('trainButton').disabled = true;
    document.getElementById('trainingStatus').innerHTML = '';
    document.getElementById('predictionSection').style.display = 'none';
    document.getElementById('networkConfig').style.display = 'none';
    document.getElementById('configControls').style.display = 'none';
    document.getElementById('clearButton').style.display = 'none';
    document.getElementById('predictionOutput').textContent = '';
    document.getElementById('lossGraphContainer').style.display = 'none';
    document.getElementById('finalLossDisplay').textContent = '';
    document.getElementById('accuracyDisplay').textContent = '';
    document.getElementById('accuracyDisplay').style.display = 'none';
    document.getElementById('weightHeatmapContainer').style.display = 'none';
    
    // Reset configuration controls to defaults
    document.getElementById('activationSelect').value = '0';
    document.getElementById('hiddenSizeSlider').value = '6';
    document.getElementById('hiddenSizeValue').textContent = '6';
    
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
    
    // Validate that Iris predictions use normalized inputs
    if (parsedData.datasetName === 'Iris Setosa Classification') {
        // Iris dataset should have normalized inputs stored
        if (!parsedData.inputs || parsedData.inputs.length === 0) {
            updateStatus('[ERROR] Iris dataset not properly normalized');
            return;
        }
        // Verify inputs are in [0,1] range (normalized)
        const sampleInput = parsedData.inputs[0];
        if (sampleInput < 0 || sampleInput > 1) {
            updateStatus('[ERROR] Iris inputs must be normalized to [0,1] range');
            return;
        }
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
            
            // For Iris dataset, normalize user input using stored stats
            if (parsedData.datasetName === 'Iris Setosa Classification' && parsedData.normalizationStats) {
                const stats = parsedData.normalizationStats[i];
                const normalizedValue = (numValue - stats.min) / (stats.max - stats.min);
                inputValues.push(normalizedValue);
                updateStatus(`[NORMALIZE] ${columnName}: ${numValue} → ${normalizedValue.toFixed(4)} (normalized)`);
            } else {
                inputValues.push(numValue);
            }
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

// Load pre-loaded dataset
function loadPreloadedDataset(datasetKey) {
    // Pre-loaded datasets require v2 features
    if (!wasm || !wasm.hasV2Features) {
        updateStatus('[ERROR] Pre-loaded datasets require v2 features (not available in current build)');
        return;
    }
    
    const dataset = PRELOADED_DATASETS[datasetKey];
    if (!dataset) {
        updateStatus('[ERROR] Dataset not found');
        return;
    }
    
    // Prepare data based on dataset type
    let inputs, outputs, normalizationStats = null;
    
    if (dataset.needsNormalization && dataset.data.rawSamples) {
        // Normalize Iris dataset
        const normalized = normalizeIrisData(dataset.data.rawSamples);
        inputs = normalized.inputs;
        outputs = normalized.outputs;
        normalizationStats = normalized.stats;
        updateStatus('[DATA] Iris dataset normalized to [0,1] range');
        
        // Log normalization stats
        normalized.stats.forEach((stat, idx) => {
            updateStatus(`[NORMALIZE] ${dataset.featureNames[idx]}: min=${stat.min.toFixed(2)}, max=${stat.max.toFixed(2)}`);
        });
    } else {
        // Use data as-is for XOR and linear regression
        inputs = dataset.data.inputs;
        outputs = dataset.data.outputs;
    }
    
    // Create parsedData object compatible with training function
    parsedData = {
        n_inputs: dataset.data.n_inputs,
        inputs: inputs,
        outputs: outputs,
        n_rows: dataset.data.n_rows,
        encoder: null, // Pre-loaded datasets don't need encoding
        columnNames: dataset.featureNames,
        outputColumnName: 'y',
        datasetName: dataset.name,
        normalizationStats: normalizationStats
    };
    
    // Update UI
    const messageDiv = document.getElementById('validationMessage');
    messageDiv.textContent = `✓ Loaded: ${dataset.name} (${dataset.data.n_rows} samples, ${dataset.data.n_inputs} features)`;
    messageDiv.className = 'message success';
    
    // Enable train button and show configuration controls
    document.getElementById('trainButton').disabled = false;
    document.getElementById('configControls').style.display = 'block';
    
    // Update status
    updateStatus(`[DATA] Loaded pre-loaded dataset: ${dataset.name}`);
    updateStatus(`[DATA] ${dataset.data.n_rows} samples with ${dataset.data.n_inputs} features`);
    
    // Clear file input if any
    document.getElementById('fileInput').value = '';
}

// Display dataset information when selected
function displayDatasetInfo(datasetKey) {
    const dataset = PRELOADED_DATASETS[datasetKey];
    const infoDiv = document.getElementById('datasetInfo');
    
    if (!dataset) {
        infoDiv.style.display = 'none';
        return;
    }
    
    // Build feature list
    const featureList = dataset.featureNames.join(', ');
    
    infoDiv.innerHTML = `
        <h4>${dataset.name}</h4>
        <p>${dataset.description}</p>
        <div class="info-row">
            <div class="info-item"><strong>Samples:</strong> ${dataset.data.n_rows}</div>
            <div class="info-item"><strong>Features:</strong> ${dataset.data.n_inputs}</div>
        </div>
        <div class="info-item" style="margin-top: 8px;">
            <strong>Feature Names:</strong> ${featureList}
        </div>
    `;
    
    infoDiv.style.display = 'block';
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Wait for Module to be available (it's loaded from neurobrain.js)
    if (typeof Module === 'undefined') {
        console.error('Module not found - ensure neurobrain.js is loaded first');
        updateStatus('[ERROR] WASM module not found');
        return;
    }
    initWASM().then(() => {
        // Hide v2 features if not available
        if (!wasm.hasV2Features) {
            // Hide configuration controls
            const configControls = document.getElementById('configControls');
            if (configControls) {
                configControls.style.display = 'none';
            }
            
            // Hide dataset selector (pre-loaded datasets require v2 features)
            const datasetSelector = document.getElementById('datasetSelector');
            if (datasetSelector) {
                datasetSelector.style.display = 'none';
            }
            
            // Add notice about limited features
            const uploadSection = document.querySelector('.upload-section');
            if (uploadSection) {
                const notice = document.createElement('div');
                notice.className = 'message info';
                notice.style.marginTop = '10px';
                notice.textContent = 'ℹ️ Running in v1 mode: Upload CSV to train with basic features (6 hidden neurons, sigmoid activation)';
                uploadSection.appendChild(notice);
            }
        }
    });
    
    const fileInput = document.getElementById('fileInput');
    const uploadArea = document.getElementById('uploadArea');
    const datasetSelect = document.getElementById('datasetSelect');
    const loadDatasetButton = document.getElementById('loadDatasetButton');
    
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
    
    // Dataset selector
    datasetSelect.addEventListener('change', function() {
        const selectedDataset = datasetSelect.value;
        if (selectedDataset) {
            displayDatasetInfo(selectedDataset);
            loadDatasetButton.disabled = false;
        } else {
            document.getElementById('datasetInfo').style.display = 'none';
            loadDatasetButton.disabled = true;
        }
    });
    
    // Load dataset button
    loadDatasetButton.addEventListener('click', function() {
        const selectedDataset = datasetSelect.value;
        if (selectedDataset) {
            loadPreloadedDataset(selectedDataset);
        }
    });
    
    // Hidden layer size slider
    const hiddenSizeSlider = document.getElementById('hiddenSizeSlider');
    const hiddenSizeValue = document.getElementById('hiddenSizeValue');
    
    hiddenSizeSlider.addEventListener('input', function() {
        hiddenSizeValue.textContent = this.value;
    });
    
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
