# TextToSlides - AI-Powered Text to PowerPoint Generator

Transform any text, markdown, or prose into fully formatted PowerPoint presentations that match your chosen template's look and feel.

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![Live Demo](https://img.shields.io/badge/Demo-Live-blue)](https://text-to-ppt-generator.vercel.app)

## 🚀 Live Demo

Try the application here: [TextToSlides Live Demo](https://ppl-ai-code-interpreter-files.s3.amazonaws.com/web/direct-files/8adb0f8c83da403f0a4267104ec68af1/b415ee59-5e16-4753-b3ac-486a6fcb2bc9/index.html)

## ✨ Features

- **Smart Text Analysis**: AI intelligently breaks down large blocks of text into slide-ready content
- **Multi-LLM Support**: Works with OpenAI (GPT-4), Anthropic (Claude), and Google Gemini APIs
- **Template Style Preservation**: Automatically extracts and applies colors, fonts, layouts, and images from your uploaded PowerPoint templates
- **Flexible Input**: Supports plain text, markdown, and long-form prose
- **Customizable Guidance**: Optional tone and structure instructions (e.g., "investor pitch deck", "academic presentation")
- **Secure & Private**: Your API keys are never stored or logged; all processing happens client-side
- **Professional Output**: Generates downloadable .pptx files ready for presentation

## 📋 How It Works

### Input Text Analysis
The application uses advanced LLM prompting to analyze your input text through multiple stages:
1. **Content Extraction**: Identifies key themes, topics, and supporting information
2. **Structure Generation**: Creates a logical slide outline based on content flow
3. **Slide Mapping**: Intelligently distributes content across an appropriate number of slides
4. **Content Optimization**: Formats text for slide presentation (bullet points, headings, etc.)

### Template Style Application
Your uploaded PowerPoint template is processed to extract:
- **Color Palettes**: Primary and accent colors from the template theme
- **Typography**: Font families, sizes, and text styling
- **Layout Structures**: Slide layouts (title slides, content slides, section headers)
- **Visual Assets**: Images, logos, and graphics that can be reused
- **Master Slide Elements**: Headers, footers, and branding elements

The AI-generated content is then mapped to these extracted styles, ensuring your presentation maintains a professional, consistent appearance.

## 🛠 Setup and Usage

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge)
- API key from one of the supported LLM providers:
  - [OpenAI API Key](https://platform.openai.com/api-keys)
  - [Anthropic API Key](https://console.anthropic.com/)
  - [Google AI Studio API Key](https://aistudio.google.com/app/apikey)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/textoslides.git
   cd textoslides
   ```

2. **Open the application**:
   - For local development: Open `index.html` in your browser
   - For hosting: Deploy the files to any static hosting service (Vercel, Netlify, GitHub Pages)

3. **No build process required** - this is a vanilla JavaScript application that runs entirely in the browser.

### Usage Instructions

1. **Enter Your Content**
   - Paste your bulk text, markdown, or prose into the text area
   - The application handles content of any length (recommended: 500-5000 words for optimal slide count)

2. **Add Optional Guidance**
   - Provide specific instructions like "Turn into an investor pitch deck" or "Format as a training workshop"
   - This helps the AI structure content appropriately for your use case

3. **Configure AI Provider**
   - Select your preferred LLM provider (OpenAI, Anthropic, or Gemini)
   - Enter your API key (this is never stored or logged)
   - Choose the specific model to use

4. **Upload Your Template**
   - Drag and drop or select a PowerPoint file (.pptx or .potx)
   - The app will analyze and preview the template's styling
   - Supported file size: up to 50MB

5. **Generate Your Presentation**
   - Click "Generate Presentation" to start the AI processing
   - Watch the progress indicators as your presentation is created
   - Download the completed .pptx file when processing is complete

## 🔧 Technical Architecture

### Frontend
- **HTML5/CSS3**: Modern semantic markup with responsive design
- **Vanilla JavaScript**: No framework dependencies, ensuring fast load times
- **Bootstrap 5**: UI components and responsive grid system
- **File API**: Client-side file processing for security

### PowerPoint Processing
- **JSZip**: Extract and manipulate .pptx file contents
- **XML Parsing**: Process PowerPoint's OpenXML format
- **Style Extraction**: Parse theme colors, fonts, and layouts
- **Content Injection**: Insert AI-generated content while preserving formatting

### AI Integration
- **Multi-Provider Support**: Unified interface for different LLM APIs
- **Structured Prompting**: Optimized prompts for slide generation
- **Content Analysis**: Intelligent text parsing and slide structuring
- **Error Handling**: Robust error handling for API failures

### Security Features
- **Client-Side Processing**: No server-side storage of sensitive data
- **API Key Protection**: Keys are used only for API calls and never persisted
- **Input Validation**: File type and size validation before processing
- **CORS Handling**: Proper cross-origin request handling

## 🌟 Example Use Cases

### Business Presentations
- **Quarterly Reviews**: Transform financial reports into executive-ready slides
- **Project Proposals**: Convert project documentation into compelling pitch decks
- **Training Materials**: Turn training manuals into interactive workshop presentations

### Academic & Research
- **Research Papers**: Convert academic papers into conference presentations
- **Thesis Defense**: Transform dissertation chapters into defense slides
- **Lecture Content**: Turn course materials into classroom presentations

### Marketing & Sales
- **Product Launches**: Convert feature specifications into launch presentations
- **Sales Pitches**: Transform product descriptions into persuasive sales decks
- **Marketing Reports**: Turn campaign analyses into stakeholder presentations

## 🔍 Advanced Features

### Template Analysis
The application performs deep analysis of uploaded templates:
- Extracts color themes and creates harmonious palettes
- Identifies font hierarchies for consistent typography
- Maps slide layouts for content organization
- Preserves brand elements and visual identity

### Intelligent Content Mapping
- **Slide Count Optimization**: Determines optimal number of slides based on content volume
- **Content Hierarchy**: Identifies main topics, subtopics, and supporting details
- **Layout Selection**: Chooses appropriate slide layouts for different content types
- **Visual Balance**: Ensures even distribution of content across slides

### Quality Assurance
- **Content Validation**: Ensures all key points from original text are included
- **Style Consistency**: Maintains uniform formatting throughout presentation
- **Professional Standards**: Follows presentation best practices for readability and impact

## 📝 API Configuration

### OpenAI
```javascript
{
  "provider": "openai",
  "model": "gpt-4-turbo",
  "api_key": "your-openai-api-key"
}
```

### Anthropic
```javascript
{
  "provider": "anthropic",
  "model": "claude-3-5-sonnet-20241022",
  "api_key": "your-anthropic-api-key"
}
```

### Google Gemini
```javascript
{
  "provider": "gemini",
  "model": "gemini-1.5-pro",
  "api_key": "your-gemini-api-key"
}
```

## 🚨 Limitations

- **File Size**: Template files must be under 50MB
- **File Types**: Only .pptx and .potx files are supported
- **Internet Required**: Requires internet connection for LLM API calls
- **Browser Compatibility**: Works best in modern browsers with full ES6 support

## 🛡 Security & Privacy

- **No Data Storage**: No user content or API keys are stored on any server
- **Client-Side Processing**: All file processing happens in your browser
- **Secure API Calls**: API keys are used only for LLM requests and are never logged
- **HTTPS Enforcement**: All communication is encrypted in transit

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [OpenAI](https://openai.com/) for GPT models
- [Anthropic](https://www.anthropic.com/) for Claude models
- [Google](https://ai.google.dev/) for Gemini models
- [Bootstrap](https://getbootstrap.com/) for UI components
- [Bootstrap Icons](https://icons.getbootstrap.com/) for iconography

## 📞 Support

If you encounter any issues or have questions:
- [Open an Issue](https://github.com/yourusername/textoslides/issues)
- [Check the FAQ](FAQ.md)
- [View the Documentation](docs/)

---

Made with ❤️ for content creators, educators, and professionals who want to create stunning presentations effortlessly.# textoslides
AI-Powered Text to PowerPoint Generator
