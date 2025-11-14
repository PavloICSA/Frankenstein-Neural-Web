# Requirements Document

## Introduction

This feature enhances the Frankenstein Neural Web application to support mixed data types (strings and numerics) for ANN training and predictions, while adding user guidance and standard web sections (instructions, terms, privacy, contact). The enhancement enables users to work with real-world datasets containing categorical and numerical data, receive predictions based on trained models, and understand how to properly use the application.

## Glossary

- **ANN**: Artificial Neural Network - the machine learning model implemented in the application
- **Mixed Data**: Datasets containing both string (categorical) and numeric values
- **Encoding System**: The component that converts string values to numeric representations for ANN processing
- **Prediction Interface**: The UI component where users request predictions from the trained ANN
- **User Guidance Section**: Instructional content explaining data preparation and application usage
- **Standard Web Sections**: Terms of Service, Privacy Policy, and Contact information pages

## Requirements

### Requirement 1

**User Story:** As a data scientist, I want to upload CSV files containing both numeric and string values, so that I can train the ANN on real-world datasets with categorical features.

#### Acceptance Criteria

1. WHEN the User uploads a CSV file containing string values, THE Encoding System SHALL convert each unique string to a numeric identifier
2. THE Encoding System SHALL maintain a bidirectional mapping between original string values and their numeric encodings
3. THE Encoding System SHALL apply consistent encoding across all rows for the same string value
4. WHILE processing mixed data, THE ANN SHALL accept the encoded numeric values for training
5. THE Application SHALL display a summary of detected data types and encoding mappings to the User

### Requirement 2

**User Story:** As a user, I want to request predictions from the trained ANN using new input data, so that I can apply the learned model to make informed decisions.

#### Acceptance Criteria

1. WHEN the ANN training completes successfully, THE Prediction Interface SHALL become available to the User
2. THE Prediction Interface SHALL provide input fields matching the number and type of features from the training data
3. WHEN the User enters string values in the Prediction Interface, THE Encoding System SHALL convert them using the established mappings
4. IF the User enters a string value not present in the training data, THEN THE Application SHALL display a warning message indicating the unknown value
5. WHEN the User submits prediction inputs, THE ANN SHALL compute and display the predicted output value
6. THE Application SHALL decode numeric predictions back to original string labels when the output was categorical

### Requirement 3

**User Story:** As a new user, I want clear instructions on how to prepare my data and use the application, so that I can successfully train models without trial and error.

#### Acceptance Criteria

1. THE User Guidance Section SHALL include step-by-step instructions for CSV data preparation
2. THE User Guidance Section SHALL specify supported data formats and file structure requirements
3. THE User Guidance Section SHALL provide example datasets with both numeric and string values
4. THE User Guidance Section SHALL explain the training process and how to interpret results
5. THE User Guidance Section SHALL describe how to use the prediction feature with trained models

### Requirement 4

**User Story:** As a website visitor, I want access to Terms of Service, Privacy Policy, and Contact information, so that I understand my rights and can reach out with questions.

#### Acceptance Criteria

1. THE Application SHALL display a Terms of Service section accessible from the main interface
2. THE Application SHALL display a Privacy Policy section explaining data handling practices
3. THE Privacy Policy SHALL clarify that all processing occurs client-side in the browser
4. THE Application SHALL display a Contact section with methods to reach the development team
5. THE Standard Web Sections SHALL be accessible via navigation links in the application footer
