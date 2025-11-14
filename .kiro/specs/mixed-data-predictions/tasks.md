# Implementation Plan

- [x] 1. Implement DataEncoder class for mixed data type handling





  - Create `src/web/encoder.js` with DataEncoder class
  - Implement type detection logic that distinguishes numeric vs categorical columns
  - Implement label encoding for categorical values (string → sequential integers)
  - Implement bidirectional encoding/decoding maps
  - Add method to generate encoding summary for display
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Enhance CSV parser to support mixed data types





  - Modify `parseCSV` function in `app.js` to remove strict numeric validation
  - Integrate DataEncoder for automatic type detection during parsing
  - Update return structure to include encoder instance and column metadata
  - Add validation for empty values and data consistency
  - Display encoding summary after successful CSV upload
  - _Requirements: 1.1, 1.2, 1.4, 1.5_

- [x] 3. Implement prediction interface with mixed data support






  - Modify `generatePredictionInputs` to create appropriate input fields based on column types
  - Add dropdown/select inputs for categorical features with known values
  - Keep number inputs for numeric features
  - Display encoding hints next to categorical inputs
  - _Requirements: 2.1, 2.2_

- [x] 4. Implement prediction encoding and decoding logic






  - Enhance `makePrediction` function to encode user inputs before WASM call
  - Add validation for unknown categorical values with warning messages
  - Implement output decoding when prediction output is categorical
  - Display decoded prediction results with confidence information
  - _Requirements: 2.3, 2.4, 2.5, 2.6_

- [x] 5. Create user guidance and instructions section





  - Add collapsible instructions section to `index.html` with Frankenstein theme styling
  - Write step-by-step data preparation guide with CSV format requirements
  - Create example datasets section with downloadable sample CSVs (numeric, categorical, mixed)
  - Add training process explanation with loss interpretation guide
  - Document prediction feature usage and result interpretation
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 6. Implement modal system for standard web sections





  - Create modal overlay component in `index.html` with close functionality
  - Implement modal manager in `src/web/modal-manager.js` for showing/hiding content
  - Add footer navigation with links to Terms, Privacy, and Contact
  - Style modals with Frankenstein theme (dark background, neon green accents)
  - _Requirements: 4.5_

- [x] 7. Write content for Terms of Service section





  - Create Terms of Service content emphasizing educational use
  - Include disclaimer about no warranties
  - Add attribution requirements for derivative works
  - Integrate content into modal system
  - _Requirements: 4.1_

- [x] 8. Write content for Privacy Policy section





  - Create Privacy Policy explaining client-side processing
  - Clarify that no data is sent to external servers
  - Document browser-only storage and computation
  - Explain no personal data collection or tracking
  - Integrate content into modal system
  - _Requirements: 4.2, 4.3_

- [x] 9. Write content for Contact section





  - Create Contact section with GitHub repository link
  - Add email contact information
  - Include contribution guidelines and issue reporting process
  - Integrate content into modal system
  - _Requirements: 4.4_

- [x] 10. Update styling for new components





  - Add CSS for encoding summary display
  - Style categorical input dropdowns with Frankenstein theme
  - Add CSS for collapsible instruction sections
  - Style modal overlays and content
  - Add responsive design for mobile devices
  - Ensure consistent neon green and dark terminal aesthetic
  - _Requirements: All UI-related requirements_

- [x] 11. Integrate all components and test end-to-end flow





  - Wire up DataEncoder with CSV parser and prediction interface
  - Test complete flow: upload mixed CSV → train → predict with categorical inputs
  - Verify encoding/decoding consistency
  - Test unknown value warnings
  - Validate modal navigation
  - Test backward compatibility with numeric-only CSVs
  - _Requirements: All requirements_
