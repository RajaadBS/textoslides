const express = require('express');
const cors = require('cors');
const multer = require('multer');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs').promises;
const JSZip = require('jszip');
const xml2js = require('xml2js');
require('dotenv').config();

// Import AI providers
const OpenAI = require('openai');
const Anthropic = require('@anthropic-ai/sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');

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

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

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
    async analyzeTemplate(templateBuffer) {
        try {
            const zip = new JSZip();
            const zipContent = await zip.loadAsync(templateBuffer);

            // Extract basic template information
            const analysis = {
                slideLayouts: await this.extractLayouts(zipContent),
                theme: await this.extractTheme(zipContent),
                images: await this.extractImages(zipContent),
                metadata: await this.extractMetadata(zipContent)
            };

            return analysis;
        } catch (error) {
            console.error('Template analysis error:', error);
            throw new Error('Failed to analyze PowerPoint template');
        }
    }

    async extractLayouts(zip) {
        // Extract layout information from the PowerPoint structure
        const layouts = [];
        const layoutFiles = Object.keys(zip.files).filter(name => name.startsWith('ppt/slideLayouts/'));
        
        for (const layoutFile of layoutFiles) {
            try {
                const layoutXml = await zip.file(layoutFile).async('string');
                layouts.push({
                    name: layoutFile.split('/').pop(),
                    content: layoutXml
                });
            } catch (error) {
                console.error(`Error processing layout ${layoutFile}:`, error);
            }
        }
        
        return layouts;
    }

    async extractTheme(zip) {
        try {
            const themeFile = zip.file('ppt/theme/theme1.xml');
            if (themeFile) {
                const themeXml = await themeFile.async('string');
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
        } catch (error) {
            console.error('Theme extraction error:', error);
        }
        
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

    async extractImages(zip) {
        const images = [];
        const mediaFiles = Object.keys(zip.files).filter(name => name.startsWith('ppt/media/'));
        
        for (const mediaFile of mediaFiles) {
            images.push({
                name: mediaFile.split('/').pop(),
                path: mediaFile
            });
        }
        
        return images;
    }

    async extractMetadata(zip) {
        try {
            const appFile = zip.file('docProps/app.xml');
            if (appFile) {
                const appXml = await appFile.async('string');
                return { appProperties: appXml };
            }
        } catch (error) {
            console.error('Metadata extraction error:', error);
        }
        
        return {};
    }
}

// Simple PowerPoint Builder (using basic PPTX structure)
class PresentationBuilder {
    constructor() {
        this.templateAnalyzer = new TemplateAnalyzer();
    }

    async buildPresentation(slideStructure, templateBuffer, templateAnalysis) {
        try {
            // Create a basic PPTX structure
            const zip = new JSZip();
            
            // Add basic PPTX structure
            await this.addBasicStructure(zip);
            await this.addSlides(zip, slideStructure, templateAnalysis);
            
            // Generate the final PPTX
            const pptxBuffer = await zip.generateAsync({
                type: 'nodebuffer',
                mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
            });
            
            return pptxBuffer;
            
        } catch (error) {
            console.error('Presentation building error:', error);
            throw new Error('Failed to build presentation');
        }
    }

    async addBasicStructure(zip) {
        // Add minimal PPTX structure
        zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
<Override PartName="/ppt/slides/slide1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>
</Types>`);

        zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
</Relationships>`);

        zip.file('ppt/presentation.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
<p:sldIdLst>
<p:sldId id="256" r:id="rId1" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/>
</p:sldIdLst>
<p:sldSz cx="9144000" cy="6858000" type="screen4x3"/>
</p:presentation>`);
    }

    async addSlides(zip, slideStructure, templateAnalysis) {
        // Add a basic slide
        const slideContent = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
<p:cSld>
<p:spTree>
<p:nvGrpSpPr>
<p:cNvPr id="1" name=""/>
<p:cNvGrpSpPr/>
<p:nvPr/>
</p:nvGrpSpPr>
<p:grpSpPr>
<a:xfrm xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
<a:off x="0" y="0"/>
<a:ext cx="0" cy="0"/>
<a:chOff x="0" y="0"/>
<a:chExt cx="0" cy="0"/>
</a:xfrm>
</p:grpSpPr>
<p:sp>
<p:nvSpPr>
<p:cNvPr id="2" name="Title 1"/>
<p:cNvSpPr>
<a:spLocks noGrp="1" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"/>
</p:cNvSpPr>
<p:nvPr>
<p:ph type="ctrTitle"/>
</p:nvPr>
</p:nvSpPr>
<p:spPr/>
<p:txBody>
<a:bodyPr xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"/>
<a:lstStyle xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"/>
<a:p xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
<a:r>
<a:rPr lang="en-US" dirty="0" smtClean="0"/>
<a:t>Generated Presentation</a:t>
</a:r>
<a:endParaRPr lang="en-US" dirty="0"/>
</a:p>
</p:txBody>
</p:sp>
</p:spTree>
</p:cSld>
<p:clrMapOvr>
<a:masterClrMapping xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"/>
</p:clrMapOvr>
</p:sld>`;

        zip.file('ppt/slides/slide1.xml', slideContent);
    }
}

// API Routes

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
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

// Start server
app.listen(PORT, () => {
    console.log(`TextToSlides server running on port ${PORT}`);
    console.log(`API endpoints:`);
    console.log(`- GET /api/health`);
    console.log(`- POST /api/analyze-template`);
    console.log(`- POST /api/generate-presentation`);
});

module.exports = app;
