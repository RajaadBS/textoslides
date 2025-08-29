const express = require('express');
const cors = require('cors');
const multer = require('multer');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const JSZip = require('jszip');
const xml2js = require('xml2js');
require('dotenv').config();

// Import AI providers
const OpenAI = require('openai');
const Anthropic = require('@anthropic-ai/sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 3001;

// Create temp directories on startup
const createTempDirs = () => {
    const dirs = ['temp', 'temp/output', 'temp/media'];
    dirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    });
};
createTempDirs();

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://fonts.googleapis.com"],
            scriptSrc: ["'self'", "https://cdn.jsdelivr.net"],
            imgSrc: ["'self'", "data:", "https:", "blob:"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdn.jsdelivr.net"],
            connectSrc: ["'self'", "https://api.openai.com", "https://api.anthropic.com", "https://generativelanguage.googleapis.com"],
        },
    },
}));

// CORS configuration for Render
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://textoslides.onrender.com', /\.onrender\.com$/]
        : ['http://localhost:3001', 'http://127.0.0.1:3001'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 10 : 100,
    message: 'Too many requests, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: process.env.NODE_ENV === 'production' ? '1d' : '0'
}));

// File upload configuration
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit
        files: 1
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
        const prompt = `Analyze the following text and create a presentation outline:

Text: ${text}
Guidance: ${guidance}

Create a JSON response with:
{
    "title": "Presentation Title",
    "themes": ["Theme 1", "Theme 2", "Theme 3"],
    "keyPoints": {
        "Theme 1": ["Point 1", "Point 2"],
        "Theme 2": ["Point 1", "Point 2"]
    },
    "slideCount": 8,
    "structure": "logical flow description"
}`;

        try {
            const response = await this.client.chat.completions.create({
                model: this.model,
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.3,
                max_tokens: 2000
            });

            const content = response.choices[0].message.content;
            return JSON.parse(content);
        } catch (error) {
            console.error('OpenAI API Error:', error);
            throw new Error('Failed to analyze text with OpenAI');
        }
    }

    async generateSlideStructure(analysis, guidance = '') {
        const prompt = `Create detailed slides based on this analysis:

Analysis: ${JSON.stringify(analysis)}
Guidance: ${guidance}

Return JSON with this structure:
{
    "totalSlides": number,
    "slides": [
        {
            "slideNumber": 1,
            "type": "title",
            "title": "Slide Title",
            "content": ["Main point 1", "Main point 2"],
            "notes": "Speaker notes"
        }
    ]
}`;

        try {
            const response = await this.client.chat.completions.create({
                model: this.model,
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.2,
                max_tokens: 3000
            });

            const content = response.choices[0].message.content;
            return JSON.parse(content);
        } catch (error) {
            console.error('OpenAI Slide Generation Error:', error);
            throw new Error('Failed to generate slide structure');
        }
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
        const prompt = `Analyze this text for presentation creation:

<text>${text}</text>
<guidance>${guidance}</guidance>

Return structured JSON analysis for slide generation.`;

        try {
            const response = await this.client.messages.create({
                model: this.model,
                max_tokens: 2000,
                messages: [{ role: 'user', content: prompt }],
            });

            return JSON.parse(response.content[0].text);
        } catch (error) {
            console.error('Anthropic API Error:', error);
            throw new Error('Failed to analyze text with Anthropic');
        }
    }

    async generateSlideStructure(analysis, guidance = '') {
        const prompt = `Create slides from analysis:

<analysis>${JSON.stringify(analysis)}</analysis>
<guidance>${guidance}</guidance>

Return detailed slide structure as JSON.`;

        try {
            const response = await this.client.messages.create({
                model: this.model,
                max_tokens: 3000,
                messages: [{ role: 'user', content: prompt }],
            });

            return JSON.parse(response.content[0].text);
        } catch (error) {
            console.error('Anthropic Slide Generation Error:', error);
            throw new Error('Failed to generate slides with Anthropic');
        }
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
        const prompt = `Analyze for presentation: ${text}\nGuidance: ${guidance}\n\nReturn JSON analysis.`;

        try {
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            return JSON.parse(response.text());
        } catch (error) {
            console.error('Gemini API Error:', error);
            throw new Error('Failed to analyze text with Gemini');
        }
    }

    async generateSlideStructure(analysis, guidance = '') {
        const prompt = `Create slides from: ${JSON.stringify(analysis)}\nGuidance: ${guidance}\n\nReturn slide JSON.`;

        try {
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            return JSON.parse(response.text());
        } catch (error) {
            console.error('Gemini Slide Generation Error:', error);
            throw new Error('Failed to generate slides with Gemini');
        }
    }
}

// PowerPoint Template Analyzer
class TemplateAnalyzer {
    async analyzeTemplate(templateBuffer) {
        try {
            const zip = new JSZip();
            const zipContent = await zip.loadAsync(templateBuffer);

            const analysis = {
                slideLayouts: await this.extractLayouts(zipContent),
                theme: await this.extractTheme(zipContent),
                images: await this.extractImages(zipContent),
                metadata: { analyzed: true, timestamp: new Date().toISOString() }
            };

            return analysis;
        } catch (error) {
            console.error('Template analysis error:', error);
            return {
                slideLayouts: [],
                theme: this.getDefaultTheme(),
                images: [],
                metadata: { analyzed: false, error: error.message }
            };
        }
    }

    async extractLayouts(zip) {
        const layouts = [];
        try {
            const layoutFiles = Object.keys(zip.files).filter(name => 
                name.startsWith('ppt/slideLayouts/') && name.endsWith('.xml')
            );
            
            for (const layoutFile of layoutFiles.slice(0, 5)) { // Limit to 5 layouts
                const layoutXml = await zip.file(layoutFile).async('string');
                layouts.push({
                    name: layoutFile.split('/').pop().replace('.xml', ''),
                    type: this.determineLayoutType(layoutXml)
                });
            }
        } catch (error) {
            console.error('Layout extraction error:', error);
        }
        
        return layouts.length > 0 ? layouts : this.getDefaultLayouts();
    }

    determineLayoutType(xml) {
        if (xml.includes('ctrTitle')) return 'title';
        if (xml.includes('body')) return 'content';
        if (xml.includes('twoColTx')) return 'two-column';
        return 'basic';
    }

    async extractTheme(zip) {
        try {
            const themeFile = zip.file('ppt/theme/theme1.xml');
            if (themeFile) {
                const themeXml = await themeFile.async('string');
                return this.parseTheme(themeXml);
            }
        } catch (error) {
            console.error('Theme extraction error:', error);
        }
        
        return this.getDefaultTheme();
    }

    parseTheme(themeXml) {
        // Basic theme parsing
        return {
            colorScheme: {
                primary: '#1f497d',
                secondary: '#4f81bd',
                accent: '#9cbb58',
                background: '#ffffff'
            },
            fontScheme: {
                majorFont: 'Calibri',
                minorFont: 'Calibri'
            }
        };
    }

    async extractImages(zip) {
        const images = [];
        try {
            const mediaFiles = Object.keys(zip.files).filter(name => 
                name.startsWith('ppt/media/') && /\.(png|jpg|jpeg|gif)$/i.test(name)
            );
            
            images.push(...mediaFiles.map(file => ({
                name: file.split('/').pop(),
                path: file,
                type: path.extname(file).toLowerCase()
            })));
        } catch (error) {
            console.error('Image extraction error:', error);
        }
        
        return images;
    }

    getDefaultTheme() {
        return {
            colorScheme: {
                primary: '#1f497d',
                secondary: '#4f81bd', 
                accent: '#9cbb58',
                background: '#ffffff'
            },
            fontScheme: {
                majorFont: 'Calibri',
                minorFont: 'Calibri'
            }
        };
    }

    getDefaultLayouts() {
        return [
            { name: 'title', type: 'title' },
            { name: 'content', type: 'content' },
            { name: 'two-column', type: 'two-column' }
        ];
    }
}

// Simple PowerPoint Builder
class PresentationBuilder {
    async buildPresentation(slideStructure, templateBuffer, templateAnalysis) {
        try {
            const zip = new JSZip();
            
            // Add basic PPTX structure
            await this.addBasicStructure(zip, slideStructure);
            await this.addSlides(zip, slideStructure, templateAnalysis);
            
            const pptxBuffer = await zip.generateAsync({
                type: 'nodebuffer',
                mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
            });
            
            return pptxBuffer;
            
        } catch (error) {
            console.error('Presentation building error:', error);
            throw new Error('Failed to build presentation: ' + error.message);
        }
    }

    async addBasicStructure(zip, slideStructure) {
        // Content Types
        zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
${slideStructure.slides.map((_, i) => 
    `<Override PartName="/ppt/slides/slide${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`
).join('\n')}
</Types>`);

        // Root relationships
        zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
</Relationships>`);

        // Presentation
        zip.file('ppt/presentation.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<p:sldIdLst>
${slideStructure.slides.map((_, i) => 
    `<p:sldId id="${256 + i}" r:id="rId${i + 1}"/>`
).join('\n')}
</p:sldIdLst>
<p:sldSz cx="9144000" cy="6858000" type="screen4x3"/>
</p:presentation>`);

        // Presentation relationships
        zip.file('ppt/_rels/presentation.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
${slideStructure.slides.map((_, i) => 
    `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${i + 1}.xml"/>`
).join('\n')}
</Relationships>`);
    }

    async addSlides(zip, slideStructure, templateAnalysis) {
        for (let i = 0; i < slideStructure.slides.length; i++) {
            const slide = slideStructure.slides[i];
            const slideXml = this.generateSlideXml(slide, i + 1);
            zip.file(`ppt/slides/slide${i + 1}.xml`, slideXml);
        }
    }

    generateSlideXml(slide, slideNumber) {
        const title = slide.title || `Slide ${slideNumber}`;
        const content = Array.isArray(slide.content) 
            ? slide.content.join('\n• ') 
            : (slide.content || '');

        return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
<p:cSld>
<p:spTree>
<p:nvGrpSpPr>
<p:cNvPr id="1" name=""/>
<p:cNvGrpSpPr/>
<p:nvPr/>
</p:nvGrpSpPr>
<p:grpSpPr>
<a:xfrm>
<a:off x="0" y="0"/>
<a:ext cx="0" cy="0"/>
<a:chOff x="0" y="0"/>
<a:chExt cx="0" cy="0"/>
</a:xfrm>
</p:grpSpPr>
<p:sp>
<p:nvSpPr>
<p:cNvPr id="2" name="Title"/>
<p:cNvSpPr>
<a:spLocks noGrp="1"/>
</p:cNvSpPr>
<p:nvPr>
<p:ph type="title"/>
</p:nvPr>
</p:nvSpPr>
<p:spPr/>
<p:txBody>
<a:bodyPr/>
<a:lstStyle/>
<a:p>
<a:r>
<a:rPr lang="en-US" sz="3200" b="1">
<a:solidFill>
<a:schemeClr val="tx1"/>
</a:solidFill>
<a:latin typeface="Calibri"/>
</a:rPr>
<a:t>${this.escapeXml(title)}</a:t>
</a:r>
</a:p>
</a:txBody>
</p:sp>
${content ? `<p:sp>
<p:nvSpPr>
<p:cNvPr id="3" name="Content"/>
<p:cNvSpPr>
<a:spLocks noGrp="1"/>
</p:cNvSpPr>
<p:nvPr>
<p:ph type="body"/>
</p:nvPr>
</p:nvSpPr>
<p:spPr/>
<p:txBody>
<a:bodyPr/>
<a:lstStyle/>
<a:p>
<a:r>
<a:rPr lang="en-US" sz="2000">
<a:solidFill>
<a:schemeClr val="tx1"/>
</a:solidFill>
<a:latin typeface="Calibri"/>
</a:rPr>
<a:t>• ${this.escapeXml(content)}</a:t>
</a:r>
</a:p>
</a:txBody>
</p:sp>` : ''}
</p:spTree>
</p:cSld>
<p:clrMapOvr>
<a:masterClrMapping/>
</p:clrMapOvr>
</p:sld>`;
    }

    escapeXml(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }
}

// API Routes

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0'
    });
});

// Root route
app.get('/', (req, res) => {
    const indexPath = path.join(__dirname, 'public', 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.json({
            message: 'TextToSlides API is running!',
            endpoints: [
                'GET /api/health',
                'POST /api/analyze-template',
                'POST /api/generate-presentation'
            ]
        });
    }
});

// Analyze template endpoint
app.post('/api/analyze-template', upload.single('template'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No template file provided' });
        }

        console.log('Analyzing template:', req.file.originalname, req.file.size, 'bytes');

        const analyzer = new TemplateAnalyzer();
        const analysis = await analyzer.analyzeTemplate(req.file.buffer);

        res.json({ 
            success: true, 
            analysis,
            filename: req.file.originalname,
            size: req.file.size
        });
    } catch (error) {
        console.error('Template analysis error:', error);
        res.status(500).json({ 
            error: 'Failed to analyze template',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Generate presentation endpoint
app.post('/api/generate-presentation', upload.single('template'), async (req, res) => {
    try {
        const { text, guidance, llmProvider, llmModel, apiKey } = req.body;

        // Validate required fields
        if (!text || !llmProvider || !apiKey || !req.file) {
            return res.status(400).json({ 
                error: 'Missing required fields',
                required: ['text', 'llmProvider', 'apiKey', 'template file']
            });
        }

        console.log(`Generating presentation using ${llmProvider} with ${llmModel || 'default model'}`);

        // Initialize LLM provider
        const provider = LLMProviderFactory.createProvider({
            provider: llmProvider,
            model: llmModel,
            apiKey: apiKey
        });

        // Step 1: Analyze text
        console.log('Step 1: Analyzing text...');
        const textAnalysis = await provider.analyzeText(text, guidance);

        // Step 2: Generate slide structure
        console.log('Step 2: Generating slide structure...');
        const slideStructure = await provider.generateSlideStructure(textAnalysis, guidance);

        // Step 3: Analyze template
        console.log('Step 3: Analyzing template...');
        const templateAnalyzer = new TemplateAnalyzer();
        const templateAnalysis = await templateAnalyzer.analyzeTemplate(req.file.buffer);

        // Step 4: Build presentation
        console.log('Step 4: Building presentation...');
        const builder = new PresentationBuilder();
        const presentationBuffer = await builder.buildPresentation(
            slideStructure,
            req.file.buffer,
            templateAnalysis
        );

        console.log('Presentation generated successfully, size:', presentationBuffer.length, 'bytes');

        // Return the generated presentation
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
        res.setHeader('Content-Disposition', 'attachment; filename="generated-presentation.pptx"');
        res.send(presentationBuffer);

    } catch (error) {
        console.error('Presentation generation error:', error);
        res.status(500).json({ 
            error: 'Failed to generate presentation',
            details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Server error:', error);

    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File size too large. Maximum 50MB allowed.' });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({ error: 'Too many files. Only one file allowed.' });
        }
    }
    
    res.status(500).json({ 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ 
        error: 'Not found',
        path: req.originalUrl,
        available_endpoints: [
            'GET /',
            'GET /api/health', 
            'POST /api/analyze-template',
            'POST /api/generate-presentation'
        ]
    });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 TextToSlides server running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 Available endpoints:`);
    console.log(`   - GET /api/health`);
    console.log(`   - POST /api/analyze-template`);
    console.log(`   - POST /api/generate-presentation`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('Received SIGTERM. Shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('Received SIGINT. Shutting down gracefully...');
    process.exit(0);
});

module.exports = app;
