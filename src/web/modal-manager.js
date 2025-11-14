/**
 * Modal Manager
 * Handles showing/hiding modal dialogs for Terms, Privacy, Contact, etc.
 */

class ModalManager {
    constructor() {
        this.overlay = document.getElementById('modalOverlay');
        this.modalBody = document.getElementById('modalBody');
        this.closeButton = document.getElementById('modalClose');
        
        // Bind event listeners
        this.closeButton.addEventListener('click', () => this.hide());
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.hide();
            }
        });
        
        // ESC key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.overlay.classList.contains('active')) {
                this.hide();
            }
        });
    }
    
    /**
     * Show modal with specified content
     * @param {string} content - HTML content to display
     */
    show(content) {
        this.modalBody.innerHTML = content;
        this.overlay.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }
    
    /**
     * Hide modal
     */
    hide() {
        this.overlay.classList.remove('active');
        document.body.style.overflow = ''; // Restore scrolling
    }
    
    /**
     * Show Terms of Service
     */
    showTerms() {
        const content = `
            <h2>⚡ TERMS OF SERVICE ⚡</h2>
            <div class="modal-text">
                <p><strong>Last Updated:</strong> November 2025</p>
                
                <h3>1. Educational Use</h3>
                <p>Frankenstein Neural Web is provided as an educational tool for learning about neural networks, WebAssembly, and machine learning concepts. It is intended for demonstration and learning purposes only.</p>
                
                <h3>2. No Warranties</h3>
                <p>This software is provided "as is" without warranty of any kind, express or implied, including but not limited to the warranties of merchantability, fitness for a particular purpose, and noninfringement. In no event shall the authors or copyright holders be liable for any claim, damages, or other liability arising from the use of this software.</p>
                
                <h3>3. Use at Your Own Risk</h3>
                <p>You acknowledge that:</p>
                <ul>
                    <li>The neural network predictions are for educational purposes and should not be used for critical decision-making</li>
                    <li>Results may vary based on data quality and quantity</li>
                    <li>The software may contain bugs or limitations</li>
                    <li>You are responsible for validating any results before use</li>
                </ul>
                
                <h3>4. Attribution Requirements</h3>
                <p>If you create derivative works or use this code in your projects, you must:</p>
                <ul>
                    <li>Provide appropriate credit to the original authors</li>
                    <li>Include a link to the original repository</li>
                    <li>Indicate if changes were made</li>
                    <li>Comply with the terms of the project's open-source license</li>
                </ul>
                
                <h3>5. Data Processing</h3>
                <p>All data processing occurs entirely in your browser. We do not collect, store, or transmit your data to any external servers. See our Privacy Policy for more details.</p>
                
                <h3>6. Modifications</h3>
                <p>We reserve the right to modify these terms at any time. Continued use of the application constitutes acceptance of any changes.</p>
                
                <h3>7. Acceptable Use</h3>
                <p>You agree not to:</p>
                <ul>
                    <li>Use the software for any illegal purposes</li>
                    <li>Attempt to reverse engineer or exploit vulnerabilities</li>
                    <li>Use the software to process sensitive personal data without proper safeguards</li>
                    <li>Misrepresent the capabilities or accuracy of the neural network</li>
                </ul>
                
                <h3>8. Open Source</h3>
                <p>This project is open source and available on GitHub. Contributions are welcome under the terms of the project license.</p>
                
                <p class="tip">💡 By using Frankenstein Neural Web, you acknowledge that you have read and agree to these terms.</p>
            </div>
        `;
        this.show(content);
    }
    
    /**
     * Show Privacy Policy
     */
    showPrivacy() {
        const content = `
            <h2>⚡ PRIVACY POLICY ⚡</h2>
            <div class="modal-text">
                <p><strong>Last Updated:</strong> November 2025</p>
                
                <h3>1. Client-Side Processing</h3>
                <p>Frankenstein Neural Web operates entirely in your web browser using WebAssembly technology. All neural network training and predictions happen locally on your device.</p>
                
                <h3>2. No Data Collection</h3>
                <p>We do not collect, store, or transmit any of your data. Specifically:</p>
                <ul>
                    <li><strong>CSV Files:</strong> Your uploaded CSV files are processed only in your browser's memory</li>
                    <li><strong>Training Data:</strong> Neural network training occurs locally; no data leaves your device</li>
                    <li><strong>Predictions:</strong> All prediction inputs and outputs remain on your device</li>
                    <li><strong>Personal Information:</strong> We do not collect names, emails, or any personal identifiers</li>
                </ul>
                
                <h3>3. No Server Communication</h3>
                <p>This application does not send any data to external servers. The only network requests are:</p>
                <ul>
                    <li>Loading the initial HTML, CSS, and JavaScript files</li>
                    <li>Loading the WebAssembly module</li>
                </ul>
                <p>After the page loads, the application functions completely offline.</p>
                
                <h3>4. Browser Storage</h3>
                <p>The application does not use cookies, localStorage, or any persistent browser storage. All data exists only in memory during your session and is cleared when you:</p>
                <ul>
                    <li>Close the browser tab</li>
                    <li>Refresh the page</li>
                    <li>Click the "Clear & Reset" button</li>
                </ul>
                
                <h3>5. No Tracking or Analytics</h3>
                <p>We do not use:</p>
                <ul>
                    <li>Google Analytics or similar tracking services</li>
                    <li>Advertising networks or pixels</li>
                    <li>Third-party cookies</li>
                    <li>Session recording tools</li>
                    <li>Any form of user behavior tracking</li>
                </ul>
                
                <h3>6. Open Source Transparency</h3>
                <p>This application is open source. You can inspect the complete source code on GitHub to verify our privacy claims. The code is available for audit by anyone.</p>
                
                <h3>7. Browser Security</h3>
                <p>Your browser's built-in security features protect your data:</p>
                <ul>
                    <li>WebAssembly runs in a sandboxed environment</li>
                    <li>JavaScript operates within browser security constraints</li>
                    <li>No access to your file system beyond files you explicitly upload</li>
                </ul>
                
                <h3>8. Third-Party Services</h3>
                <p>This application does not integrate with any third-party services, APIs, or external resources beyond the initial page load from the hosting server.</p>
                
                <h3>9. Your Control</h3>
                <p>You have complete control over your data:</p>
                <ul>
                    <li>Data exists only while you use the application</li>
                    <li>You can clear data at any time using the "Clear & Reset" button</li>
                    <li>Closing the tab permanently removes all data from memory</li>
                </ul>
                
                <h3>10. Questions or Concerns</h3>
                <p>If you have questions about privacy or data handling, please contact us through the Contact section or open an issue on our GitHub repository.</p>
                
                <p class="tip">💡 Your privacy is paramount. This application is designed to keep your data entirely under your control.</p>
            </div>
        `;
        this.show(content);
    }
    
    /**
     * Show Contact Information
     */
    showContact() {
        const content = `
            <h2>⚡ CONTACT ⚡</h2>
            <div class="modal-text">
                <h3>Get in Touch</h3>
                <p>We welcome feedback, questions, and contributions to Frankenstein Neural Web!</p>
                
                <h3>GitHub Repository</h3>
                <p>The primary way to interact with the project is through GitHub:</p>
                <ul>
                    <li><strong>Repository:</strong> <a href="https://github.com/PavloICSA/Frankenstein-Neural-Web" target="_blank" rel="noopener noreferrer">github.com/PavloICSA/Frankenstein-Neural-Web</a></li>
                    <li><strong>Issues:</strong> Report bugs or request features by opening an issue</li>
                    <li><strong>Pull Requests:</strong> Contribute code improvements or new features</li>
                    <li><strong>Discussions:</strong> Ask questions or share ideas in GitHub Discussions</li>
                </ul>
                
                <h3>Email Contact</h3>
                <p>For private inquiries or security concerns:</p>
                <ul>
                    <li><strong>Email:</strong> <a href="mailto:pavel.likhovid@gmail.com">pavel.likhovid@gmail.com</a></li>
                    <li>Please allow 2-3 business days for a response</li>
                </ul>
                
                <h3>Contribution Guidelines</h3>
                <p>We encourage contributions! Here's how to get started:</p>
                <ol>
                    <li><strong>Fork the Repository:</strong> Create your own copy on GitHub</li>
                    <li><strong>Create a Branch:</strong> Make your changes in a feature branch</li>
                    <li><strong>Test Your Changes:</strong> Ensure everything works correctly</li>
                    <li><strong>Submit a Pull Request:</strong> Describe your changes clearly</li>
                    <li><strong>Code Review:</strong> Maintainers will review and provide feedback</li>
                </ol>
                
                <h3>Reporting Issues</h3>
                <p>When reporting bugs, please include:</p>
                <ul>
                    <li>Browser name and version</li>
                    <li>Operating system</li>
                    <li>Steps to reproduce the issue</li>
                    <li>Expected vs. actual behavior</li>
                    <li>Screenshots or error messages (if applicable)</li>
                </ul>
                
                <h3>Feature Requests</h3>
                <p>Have an idea for a new feature? We'd love to hear it!</p>
                <ul>
                    <li>Open a GitHub issue with the "enhancement" label</li>
                    <li>Describe the feature and its benefits</li>
                    <li>Explain your use case</li>
                    <li>Consider contributing the implementation yourself!</li>
                </ul>
                
                <h3>Security Concerns</h3>
                <p>If you discover a security vulnerability:</p>
                <ul>
                    <li><strong>Do not</strong> open a public GitHub issue</li>
                    <li>Email us directly at <a href="mailto:pavel.likhovid@gmail.com">pavel.likhovid@gmail.com</a></li>
                    <li>Provide details about the vulnerability</li>
                    <li>We will respond promptly and work on a fix</li>
                </ul>
                
                <h3>Community</h3>
                <p>Join our community of developers and learners:</p>
                <ul>
                    <li>Star the repository to show your support</li>
                    <li>Share the project with others interested in ML and WebAssembly</li>
                    <li>Contribute to documentation and examples</li>
                    <li>Help answer questions from other users</li>
                </ul>
                
                <p class="tip">💡 We appreciate your interest in Frankenstein Neural Web. Together, we can make machine learning more accessible!</p>
            </div>
        `;
        this.show(content);
    }
    
    /**
     * Show Instructions (scrolls to instructions section)
     */
    showInstructions() {
        // Close modal if open
        this.hide();
        
        // Scroll to instructions section
        const instructionsSection = document.querySelector('.instructions-section');
        if (instructionsSection) {
            instructionsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            
            // Expand instructions if collapsed
            const instructionsContent = document.getElementById('instructionsContent');
            const toggleButton = document.getElementById('toggleInstructions');
            if (instructionsContent && instructionsContent.style.display === 'none') {
                instructionsContent.style.display = 'block';
                if (toggleButton) {
                    toggleButton.innerHTML = '<span class="toggle-icon">▲</span> Hide Instructions';
                }
            }
        }
    }
}

// Initialize modal manager when DOM is ready
let modalManager;
document.addEventListener('DOMContentLoaded', () => {
    modalManager = new ModalManager();
    
    // Bind footer navigation links
    document.getElementById('instructionsLink').addEventListener('click', (e) => {
        e.preventDefault();
        modalManager.showInstructions();
    });
    
    document.getElementById('termsLink').addEventListener('click', (e) => {
        e.preventDefault();
        modalManager.showTerms();
    });
    
    document.getElementById('privacyLink').addEventListener('click', (e) => {
        e.preventDefault();
        modalManager.showPrivacy();
    });
    
    document.getElementById('contactLink').addEventListener('click', (e) => {
        e.preventDefault();
        modalManager.showContact();
    });
});
