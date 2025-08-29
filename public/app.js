// TextToSlides Frontend Application
class TextToSlidesApp {
    constructor() {
        this.currentStep = 1;
        this.appData = {
            text: '',
            guidance: '',
            llmProvider: '',
            llmModel: '',
            apiKey: '',
            templateFile: null,
            templateAnalysis: null
        };

        this.llmProviders = {
            openai: {
                name: 'OpenAI',
                models: ['gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'],
                keyUrl: 'https://platform.openai.com/api-keys'
            },
            anthropic: {
                name: 'Anthropic', 
                models: ['claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307'],
                keyUrl: 'https://console.anthropic.com/'
            },
            gemini: {
                name: 'Google Gemini',
                models: ['gemini-1.5-pro', 'gemini-1.5-flash'],
                keyUrl: 'https://aistudio.google.com/app/apikey'
            }
        };

        this.initializeApp();
    }

    initializeApp() {
        this.setupEventListeners();
        this.updateTextStats();
    }

    setupEventListeners() {
        // Text input events
        const textInput = document.getElementById('text-input');
        textInput.addEventListener('input', () => {
            this.updateTextStats();
            this.validateStep1();
        });

        // Guidance input events
        const guidanceInput = document.getElementById('guidance-input');
        guidanceInput.addEventListener('input', () => {
            this.appData.guidance = guidanceInput.value;
        });

        // LLM provider events
        const providerSelect = document.getElementById('llm-provider');
        providerSelect.addEventListener('change', (e) => {
            this.handleProviderChange(e.target.value);
        });

        const modelSelect = document.getElementById('llm-model');
        modelSelect.addEventListener('change', (e) => {
            this.appData.llmModel = e.target.value;
            this.validateStep2();
        });

        // API key events
        const apiKeyInput = document.getElementById('api-key');
        apiKeyInput.addEventListener('input', () => {
            this.appData.apiKey = apiKeyInput.value;
            this.validateStep2();
        });

        // File upload events
        const uploadArea = document.getElementById('upload-area');
        const fileInput = document.getElementById('template-file');

        uploadArea.addEventListener('click', () => fileInput.click());
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            if (e.dataTransfer.files.length > 0) {
                this.handleFileSelect(e.dataTransfer.files[0]);
            }
        });

        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleFileSelect(e.target.files[0]);
            }
        });
    }

    // Step 1: Text Input
    updateTextStats() {
        const textInput = document.getElementById('text-input');
        const text = textInput.value;
        
        const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
        const charCount = text.length;
        const slideCount = Math.max(3, Math.min(Math.ceil(wordCount / 150), 20));

        document.getElementById('word-count').textContent = wordCount;
        document.getElementById('char-count').textContent = charCount;
        document.getElementById('slide-count').textContent = slideCount;

        this.appData.text = text;
    }

    validateStep1() {
        const isValid = this.appData.text.trim().length >= 100; // Minimum 100 characters
        document.getElementById('step-1-next').disabled = !isValid;
        return isValid;
    }

    loadSample() {
        const sampleText = `# Company Growth Strategy

## Executive Summary
Our company has achieved remarkable growth over the past three years, expanding from a local startup to an international presence. This presentation outlines our strategic initiatives and future roadmap.

## Key Achievements
- Revenue growth of 300% year-over-year
- Expansion to 15 international markets
- Launch of 5 successful product lines
- Team growth from 10 to 200+ employees
- Strategic partnerships with industry leaders

## Market Analysis
The global market for our products has shown consistent growth, with a projected CAGR of 25% over the next five years. Key market drivers include:
- Increasing digital transformation initiatives
- Growing demand for automation solutions
- Regulatory changes favoring our technology
- Emerging market opportunities in Asia and Latin America

## Strategic Initiatives
### Product Innovation
We are investing heavily in R&D to maintain our competitive edge. Our innovation pipeline includes:
- Next-generation AI-powered features
- Enhanced user experience design
- Mobile-first platform development
- Integration with emerging technologies

### Market Expansion
Our expansion strategy focuses on high-growth markets with strong regulatory frameworks. Target regions include:
- Southeast Asia: Singapore, Malaysia, Thailand
- Latin America: Brazil, Mexico, Colombia
- Europe: Germany, France, United Kingdom

## Financial Projections
Based on current trends and market analysis, we project:
- 50% revenue growth in the next fiscal year
- Gross margin improvement from 65% to 70%
- Break-even in new markets within 18 months
- Positive cash flow from operations

## Investment Requirements
To achieve our growth objectives, we are seeking $10M in Series B funding:
- 40% for product development and engineering
- 30% for sales and marketing expansion
- 20% for international market entry
- 10% for operational infrastructure

## Risk Management
Key risks and mitigation strategies:
- Market competition: Continuous innovation and patent protection
- Regulatory changes: Proactive compliance and government relations
- Talent acquisition: Competitive compensation and company culture
- Economic uncertainty: Diversified revenue streams and flexible cost structure

## Conclusion
With strong market fundamentals, a proven business model, and an experienced team, we are well-positioned for continued growth. Our strategic initiatives will drive long-term value creation for all stakeholders.`;

        document.getElementById('text-input').value = sampleText;
        this.updateTextStats();
        this.validateStep1();
    }

    clearText() {
        document.getElementById('text-input').value = '';
        this.updateTextStats();
        this.validateStep1();
    }

    // Step 2: AI Configuration
    handleProviderChange(providerId) {
        this.appData.llmProvider = providerId;
        const modelSelect = document.getElementById('llm-model');
        const apiKeyLinks = document.getElementById('api-key-links');
        
        // Update model options
        modelSelect.innerHTML = '<option value="">Select Model</option>';
        
        if (providerId && this.llmProviders[providerId]) {
            const provider = this.llmProviders[providerId];
            provider.models.forEach(model => {
                const option = document.createElement('option');
                option.value = model;
                option.textContent = model;
                modelSelect.appendChild(option);
            });
            modelSelect.disabled = false;

            // Update API key help
            apiKeyLinks.innerHTML = `
                <p class="mb-2">Get your ${provider.name} API key:</p>
                <a href="${provider.keyUrl}" target="_blank" class="btn btn-sm btn-outline-primary">
                    <i class="bi bi-box-arrow-up-right me-1"></i>Get ${provider.name} API Key
                </a>
            `;
        } else {
            modelSelect.disabled = true;
            apiKeyLinks.innerHTML = '<p class="mb-0">Select a provider to see API key information.</p>';
        }
        
        this.validateStep2();
    }

    validateStep2() {
        const isValid = this.appData.llmProvider && 
                       this.appData.llmModel && 
                       this.appData.apiKey.length > 0;
        document.getElementById('step-2-next').disabled = !isValid;
        return isValid;
    }

    toggleApiKey() {
        const apiKeyInput = document.getElementById('api-key');
        const toggleIcon = document.getElementById('api-key-toggle');
        
        if (apiKeyInput.type === 'password') {
            apiKeyInput.type = 'text';
            toggleIcon.classList.replace('bi-eye', 'bi-eye-slash');
        } else {
            apiKeyInput.type = 'password';
            toggleIcon.classList.replace('bi-eye-slash', 'bi-eye');
        }
    }

    // Step 3: Template Upload
    handleFileSelect(file) {
        // Validate file
        if (!file.name.match(/\.(pptx|potx)$/i)) {
            alert('Please select a valid PowerPoint file (.pptx or .potx)');
            return;
        }

        if (file.size > 50 * 1024 * 1024) { // 50MB limit
            alert('File size must be less than 50MB');
            return;
        }

        this.appData.templateFile = file;
        this.showTemplatePreview(file);
        this.analyzeTemplate(file);
    }

    showTemplatePreview(file) {
        document.getElementById('upload-area').style.display = 'none';
        document.getElementById('template-preview').classList.remove('d-none');
        
        document.getElementById('template-name').textContent = file.name;
        document.getElementById('template-size').textContent = this.formatFileSize(file.size);
    }

    async analyzeTemplate(file) {
        const analysisDiv = document.getElementById('template-analysis');
        
        try {
            const formData = new FormData();
            formData.append('template', file);

            const response = await fetch('/api/analyze-template', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`Analysis failed: ${response.statusText}`);
            }

            const result = await response.json();
            this.appData.templateAnalysis = result.analysis;
            
            // Show analysis results
            analysisDiv.innerHTML = `
                <div class="alert alert-success">
                    <i class="bi bi-check-circle me-2"></i>
                    Template analyzed successfully! Found ${result.analysis.slideLayouts?.length || 0} layouts, 
                    ${result.analysis.images?.length || 0} images, and theme styling.
                </div>
            `;

            document.getElementById('generate-btn').disabled = false;

        } catch (error) {
            console.error('Template analysis error:', error);
            analysisDiv.innerHTML = `
                <div class="alert alert-warning">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    Could not analyze template, but generation will still work with default styling.
                </div>
            `;
            document.getElementById('generate-btn').disabled = false;
        }
    }

    removeTemplate() {
        this.appData.templateFile = null;
        this.appData.templateAnalysis = null;
        document.getElementById('upload-area').style.display = 'block';
        document.getElementById('template-preview').classList.add('d-none');
        document.getElementById('template-file').value = '';
        document.getElementById('generate-btn').disabled = true;
    }

    // Step 4: Generation
    async generatePresentation() {
        this.nextStep(4);
        
        try {
            // Show processing status
            this.showProcessingStep('step-analyze', 'Analyzing text content...');
            
            const formData = new FormData();
            formData.append('text', this.appData.text);
            formData.append('guidance', this.appData.guidance);
            formData.append('llmProvider', this.appData.llmProvider);
            formData.append('llmModel', this.appData.llmModel);
            formData.append('apiKey', this.appData.apiKey);
            formData.append('template', this.appData.templateFile);

            const response = await fetch('/api/generate-presentation', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Generation failed');
            }

            // Complete all processing steps
            this.showProcessingStep('step-structure', 'Generating slide structure...');
            await this.delay(1000);
            this.showProcessingStep('step-template', 'Applying template styles...');
            await this.delay(1000);
            this.showProcessingStep('step-build', 'Building presentation...');
            await this.delay(500);

            // Get the file blob
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            
            // Show success and download
            this.showSuccess(url);

        } catch (error) {
            console.error('Generation error:', error);
            this.showError(error.message);
        }
    }

    showProcessingStep(stepId, text) {
        // Mark previous steps as complete
        document.querySelectorAll('.processing-step').forEach(step => {
            const icon = step.querySelector('i');
            if (step.id < stepId || step.id === stepId) {
                icon.classList.replace('bi-hourglass-split', 'bi-check-circle-fill');
                icon.classList.add('text-success');
                step.classList.add('completed');
            }
        });
        
        // Update current step text
        document.getElementById('processing-text').textContent = text;
    }

    showSuccess(downloadUrl) {
        document.getElementById('processing-status').classList.add('d-none');
        document.getElementById('success-status').classList.remove('d-none');
        
        const downloadLink = document.getElementById('download-link');
        downloadLink.href = downloadUrl;
        downloadLink.download = 'generated-presentation.pptx';
    }

    showError(message) {
        document.getElementById('processing-status').classList.add('d-none');
        document.getElementById('error-status').classList.remove('d-none');
        document.getElementById('error-message').textContent = message;
    }

    startOver() {
        // Reset app data
        this.appData = {
            text: '',
            guidance: '',
            llmProvider: '',
            llmModel: '',
            apiKey: '',
            templateFile: null,
            templateAnalysis: null
        };

        // Reset form
        document.getElementById('text-input').value = '';
        document.getElementById('guidance-input').value = '';
        document.getElementById('llm-provider').value = '';
        document.getElementById('llm-model').value = '';
        document.getElementById('api-key').value = '';
        this.removeTemplate();

        // Reset processing status
        document.getElementById('processing-status').classList.remove('d-none');
        document.getElementById('success-status').classList.add('d-none');
        document.getElementById('error-status').classList.add('d-none');

        // Go back to step 1
        this.goToStep(1);
        this.updateTextStats();
    }

    // Navigation
    nextStep(stepNumber) {
        this.goToStep(stepNumber);
    }

    prevStep(stepNumber) {
        this.goToStep(stepNumber);
    }

    goToStep(stepNumber) {
        // Hide all steps
        document.querySelectorAll('.step-content').forEach(step => {
            step.classList.add('d-none');
        });
        
        // Show target step
        document.getElementById(`step-${stepNumber}`).classList.remove('d-none');
        
        // Update progress indicators
        document.querySelectorAll('.progress-steps .step').forEach((step, index) => {
            const stepNum = index + 1;
            if (stepNum <= stepNumber) {
                step.classList.add('active');
                step.classList.remove('completed');
            } else {
                step.classList.remove('active', 'completed');
            }
            if (stepNum < stepNumber) {
                step.classList.add('completed');
            }
        });
        
        this.currentStep = stepNumber;
        
        // Scroll to top
        window.scrollTo(0, 0);
    }

    // Utility functions
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Global functions for HTML onclick events
function nextStep(step) {
    app.nextStep(step);
}

function prevStep(step) {
    app.prevStep(step);
}

function setGuidance(text) {
    document.getElementById('guidance-input').value = text;
    app.appData.guidance = text;
}

function loadSample() {
    app.loadSample();
}

function clearText() {
    app.clearText();
}

function toggleApiKey() {
    app.toggleApiKey();
}

function removeTemplate() {
    app.removeTemplate();
}

function generatePresentation() {
    app.generatePresentation();
}

function startOver() {
    app.startOver();
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new TextToSlidesApp();
});
