const express = require('express');
const cors = require('cors');
const multer = require('multer');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs').promises;
require('dotenv').config();

// Import AI providers
const OpenAI = require('openai');
const Anthropic = require('@anthropic-ai/sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Import PowerPoint processing
const Automizer = require('pptx-automizer');

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
            scriptSrc: ["'self'", "https://cdn.jsdelivr.net"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 requests per windowMs
    message: 'Too many presentation generation requests, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

app.use(limiter);
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

// File upload configuration
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedMimeTypes = [
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'application/vnd.openxmlformats-officedocument.presentationml.template'
        ];
        
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only .pptx and .potx files are allowed.'));
        }
    }
});

// LLM Provider Factory
class LLMProviderFactory {
    static createProvider(providerConfig) {
        switch (providerConfig.provider) {
            case 'openai':
                return new OpenAIProvider(providerConfig);
            case 'anthropic':
                return new AnthropicProvider(providerConfig);
            case 'gemini':
                return new GeminiProvider(providerConfig);
            default:
                throw new Error(`Unsupported LLM provider: ${providerConfig.provider}`);
        }
    }
}

// OpenAI Provider Implementation
class OpenAIProvider {
    constructor(config) {
        this.client = new OpenAI({
            apiKey: config.apiKey,
        });
        this.model = config.model || 'gpt-4-turbo';
    }

    async analyzeText(text, guidance = '') {
        const prompt = `Analyze the following text and extract key information for creating a presentation:

Text: ${text}
Guidance: ${guidance}

Please provide a structured analysis with:
1. Main themes and topics (maximum 5)
2. Key supporting points for each theme
3. Important data, statistics, or examples
4. Natural content flow and logical structure
5. Conclusion or call-to-action elements

Return the response in JSON format with the structure:
{
    "themes": [...],
    "keyPoints": {...},
    "dataPoints": [...],
    "structure": {...},
    "conclusion": "..."
}`;

        const response = await this.client.chat.completions.create({
            model: this.model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
        });

        return JSON.parse(response.choices[0].message.content);
    }

    async generateSlideStructure(analysis, guidance = '') {
        const prompt = `Based on the content analysis, create a detailed slide-by-slide outline:

Content Analysis: ${JSON.stringify(analysis)}
Guidance: ${guidance}

Create an optimal slide structure with:
1. Recommended number of slides (3-15)
2. Slide titles and content hierarchy
3. Slide types (title, content, comparison, conclusion)
4. Content distribution for visual balance

Return the response in JSON format:
{
    "totalSlides": number,
    "slides": [
        {
            "slideNumber": number,
            "type": "string",
            "title": "string",
            "content": {
                "mainPoints": [...],
                "subPoints": [...],
                "notes": "string"
            }
        }
    ]
}`;

        const response = await this.client.chat.completions.create({
            model: this.model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.2,
        });

        return JSON.parse(response.choices[0].message.content);
    }
}

// Anthropic Provider Implementation
class AnthropicProvider {
    constructor(config) {
        this.client = new Anthropic({
            apiKey: config.apiKey,
        });
        this.model = config.model || 'claude-3-5-sonnet-20241022';
    }

    async analyzeText(text, guidance = '') {
        const prompt = `Analyze the following text for presentation creation:

<text>${text}</text>
<guidance>${guidance}</guidance>

Extract and structure the key information needed for slides. Return a JSON response with themes, key points, data points, content structure, and conclusions.`;

        const response = await this.client.messages.create({
            model: this.model,
            max_tokens: 2000,
            messages: [{ role: 'user', content: prompt }],
        });

        return JSON.parse(response.content[0].text);
    }

    async generateSlideStructure(analysis, guidance = '') {
        const prompt = `Create a slide structure based on this analysis:

<analysis>${JSON.stringify(analysis)}</analysis>
<guidance>${guidance}</guidance>

Generate an optimal slide-by-slide outline with appropriate slide types and content distribution. Return as JSON with slide details.`;

        const response = await this.client.messages.create({
            model: this.model,
            max_tokens: 3000,
            messages: [{ role: 'user', content: prompt }],
        });

        return JSON.parse(response.content[0].text);
    }
}

// Gemini Provider Implementation
class GeminiProvider {
    constructor(config) {
        this.client = new GoogleGenerativeAI(config.apiKey);
        this.model = this.client.getGenerativeModel({ 
            model: config.model || 'gemini-1.5-pro' 
        });
    }

    async analyzeText(text, guidance = '') {
        const prompt = `Analyze this text for presentation creation and return structured JSON:

Text: ${text}
Guidance: ${guidance}

Extract themes, key points, data, structure, and conclusions for slide generation.`;

        const result = await this.model.generateContent(prompt);
        const response = await result.response;
        
        return JSON.parse(response.text());
    }

    async generateSlideStructure(analysis, guidance = '') {
        const prompt = `Create slide structure from this analysis:

Analysis: ${JSON.stringify(analysis)}
Guidance: ${guidance}

Generate optimal slide outline with types and content. Return as JSON.`;

        const result = await this.model.generateContent(prompt);
        const response = await result.response;
        
        return JSON.parse(response.text());
    }
}

// PowerPoint Template Analyzer
class TemplateAnalyzer {
    constructor() {
        this.automizer = new Automizer({
            outputDir: './temp/output',
            mediaDir: './temp/media',
            removeExistingSlides: false,
        });
    }

    async analyzeTemplate(templateBuffer) {
        try {
            // Save template to temporary file
            const tempPath = `./temp/template_${Date.now()}.pptx`;
            await fs.writeFile(tempPath, templateBuffer);

            // Load template with automizer
            const presentation = this.automizer.loadRoot(tempPath);
            const templateInfo = await presentation.getInfo();

            // Extract template analysis
            const analysis = {
                slideLayouts: templateInfo.slideLayouts || [],
                masterSlides: templateInfo.masterSlides || [],
                theme: await this.extractThemeInfo(tempPath),
                images: templateInfo.images || [],
                metadata: templateInfo.metadata || {}
            };

            // Clean up temporary file
            await fs.unlink(tempPath).catch(console.error);

            return analysis;
        } catch (error) {
            console.error('Template analysis error:', error);
            throw new Error('Failed to analyze PowerPoint template');
        }
    }

    async extractThemeInfo(templatePath) {
        // This would extract color schemes, fonts, etc.
        // Implementation would parse the OpenXML theme files
        return {
            colorScheme: {
                primary: '#1f497d',
                secondary: '#4f81bd',
                accent: '#9cbb58'
            },
            fontScheme: {
                majorFont: 'Calibri',
                minorFont: 'Calibri'
            }
        };
    }
}

// Presentation Builder
class PresentationBuilder {
    constructor() {
        this.templateAnalyzer = new TemplateAnalyzer();
    }

    async buildPresentation(slideStructure, templateBuffer, templateAnalysis) {
        try {
            // Save template for processing
            const tempTemplatePath = `./temp/template_${Date.now()}.pptx`;
            await fs.writeFile(tempTemplatePath, templateBuffer);

            // Initialize automizer with template
            const automizer = new Automizer({
                outputDir: './temp/output',
                removeExistingSlides: true,
            });

            const presentation = automizer.loadRoot(tempTemplatePath);

            // Create slides based on structure
            for (const slide of slideStructure.slides) {
                await this.createSlide(presentation, slide, templateAnalysis);
            }

            // Generate output
            const outputPath = `./temp/output/generated_${Date.now()}.pptx`;
            await presentation.write(outputPath);

            // Read generated file
            const outputBuffer = await fs.readFile(outputPath);

            // Clean up
            await fs.unlink(tempTemplatePath).catch(console.error);
            await fs.unlink(outputPath).catch(console.error);

            return outputBuffer;
        } catch (error) {
            console.error('Presentation building error:', error);
            throw new Error('Failed to build presentation');
        }
    }

    async createSlide(presentation, slideData, templateAnalysis) {
        // Determine appropriate layout
        const layoutIndex = this.selectLayoutIndex(slideData.type);
        
        presentation.addSlide('template', layoutIndex, (slide) => {
            // Add title
            if (slideData.title) {
                slide.modifyElement('Title', [{
                    text: slideData.title,
                    fontFamily: templateAnalysis.theme?.fontScheme?.majorFont || 'Calibri',
                    fontSize: '32pt'
                }]);
            }

            // Add content
            if (slideData.content && slideData.content.mainPoints) {
                const bulletPoints = slideData.content.mainPoints.join('\n• ');
                slide.modifyElement('Content', [{
                    text: `• ${bulletPoints}`,
                    fontFamily: templateAnalysis.theme?.fontScheme?.minorFont || 'Calibri',
                    fontSize: '20pt'
                }]);
            }
        });
    }

    selectLayoutIndex(slideType) {
        const layoutMap = {
            'title': 0,
            'content': 1,
            'comparison': 2,
            'conclusion': 1
        };
        return layoutMap[slideType] || 1;
    }
}

// API Routes

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Analyze template
app.post('/api/analyze-template', upload.single('template'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No template file provided' });
        }

        const analyzer = new TemplateAnalyzer();
        const analysis = await analyzer.analyzeTemplate(req.file.buffer);

        res.json({ success: true, analysis });
    } catch (error) {
        console.error('Template analysis error:', error);
        res.status(500).json({ error: 'Failed to analyze template' });
    }
});

// Generate presentation
app.post('/api/generate-presentation', upload.single('template'), async (req, res) => {
    try {
        const { text, guidance, llmProvider, llmModel, apiKey } = req.body;

        if (!text || !llmProvider || !apiKey || !req.file) {
            return res.status(400).json({ 
                error: 'Missing required fields: text, llmProvider, apiKey, template' 
            });
        }

        // Initialize LLM provider
        const provider = LLMProviderFactory.createProvider({
            provider: llmProvider,
            model: llmModel,
            apiKey: apiKey
        });

        // Step 1: Analyze text
        const textAnalysis = await provider.analyzeText(text, guidance);

        // Step 2: Generate slide structure
        const slideStructure = await provider.generateSlideStructure(textAnalysis, guidance);

        // Step 3: Analyze template
        const templateAnalyzer = new TemplateAnalyzer();
        const templateAnalysis = await templateAnalyzer.analyzeTemplate(req.file.buffer);

        // Step 4: Build presentation
        const builder = new PresentationBuilder();
        const presentationBuffer = await builder.buildPresentation(
            slideStructure,
            req.file.buffer,
            templateAnalysis
        );

        // Return the generated presentation
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
        res.setHeader('Content-Disposition', 'attachment; filename="generated-presentation.pptx"');
        res.send(presentationBuffer);

    } catch (error) {
        console.error('Presentation generation error:', error);
        res.status(500).json({ 
            error: 'Failed to generate presentation',
            details: error.message 
        });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File size too large. Maximum 50MB allowed.' });
        }
    }
    
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
});

// Create temp directories
async function createTempDirs() {
    try {
        await fs.mkdir('./temp', { recursive: true });
        await fs.mkdir('./temp/output', { recursive: true });
        await fs.mkdir('./temp/media', { recursive: true });
    } catch (error) {
        console.error('Failed to create temp directories:', error);
    }
}

// Start server
async function startServer() {
    await createTempDirs();
    
    app.listen(PORT, () => {
        console.log(`TextToSlides server running on port ${PORT}`);
        console.log(`API endpoints:`);
        console.log(`- GET /api/health`);
        console.log(`- POST /api/analyze-template`);
        console.log(`- POST /api/generate-presentation`);
    });
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('Received SIGTERM. Shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('Received SIGINT. Shutting down gracefully...');
    process.exit(0);
});

if (require.main === module) {
    startServer().catch(console.error);
}

module.exports = app;
