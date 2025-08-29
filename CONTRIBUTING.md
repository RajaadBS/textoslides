# Contributing to TextToSlides

Thank you for your interest in contributing to TextToSlides! We welcome contributions from the community to help improve this AI-powered presentation generator.

## Getting Started

### Prerequisites
- Node.js (version 18 or higher)
- npm or yarn package manager
- Git for version control

### Development Setup

1. **Fork and Clone the Repository**
   ```bash
   git clone https://github.com/yourusername/textoslides.git
   cd textoslides
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Set Up Environment**
   ```bash
   cp .env.example .env
   # Add your test API keys for development
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

## How to Contribute

### Reporting Bugs
- Use the [Issue Tracker](https://github.com/yourusername/textoslides/issues)
- Include detailed reproduction steps
- Provide browser and system information
- Include screenshots or error logs when relevant

### Suggesting Features
- Open an issue with the "enhancement" label
- Describe the feature and its use case
- Explain how it would benefit users
- Consider implementation complexity

### Code Contributions

#### Before You Start
- Check existing issues and PRs to avoid duplicates
- Discuss major changes in an issue first
- Follow our coding standards and style guide

#### Pull Request Process

1. **Create a Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   git checkout -b bugfix/issue-description
   ```

2. **Make Your Changes**
   - Write clean, well-documented code
   - Follow existing code style and patterns
   - Add comments for complex logic
   - Update documentation if needed

3. **Test Your Changes**
   ```bash
   npm test
   npm run test:integration
   ```

4. **Commit Your Changes**
   ```bash
   git add .
   git commit -m "feat: add new slide layout detection"
   ```
   
   Follow conventional commit format:
   - `feat:` new features
   - `fix:` bug fixes
   - `docs:` documentation changes
   - `style:` code style changes
   - `refactor:` code refactoring
   - `test:` adding tests
   - `chore:` maintenance tasks

5. **Push and Create PR**
   ```bash
   git push origin feature/your-feature-name
   ```
   
   Then create a Pull Request from GitHub interface.

### Code Style Guidelines

#### JavaScript
- Use modern ES6+ syntax
- Follow consistent naming conventions
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Keep functions small and focused

#### HTML/CSS
- Use semantic HTML5 elements
- Follow BEM methodology for CSS classes
- Ensure responsive design principles
- Test across different browsers

#### Documentation
- Update README.md for user-facing changes
- Add technical documentation for new APIs
- Include code examples where helpful
- Keep documentation current and accurate

## Development Areas

### High Priority
- **LLM Integration**: Improve prompt engineering and response parsing
- **Template Analysis**: Enhanced PowerPoint style extraction
- **Performance**: Optimization for large files and complex presentations
- **Error Handling**: Better user feedback and recovery mechanisms

### Medium Priority
- **UI/UX**: Interface improvements and accessibility
- **Testing**: Expanded test coverage and integration tests
- **Documentation**: Tutorials and advanced usage guides
- **Localization**: Multi-language support

### Low Priority
- **Additional Providers**: Support for more LLM providers
- **Export Formats**: Additional output formats beyond PPTX
- **Integrations**: API integrations with other tools
- **Analytics**: Usage metrics and optimization insights

## Architecture Overview

### Frontend (Static)
- **HTML/CSS/JS**: Vanilla JavaScript for maximum compatibility
- **Bootstrap**: UI framework for responsive design
- **File Processing**: Client-side file handling for security

### Backend (Node.js)
- **Express**: Web server framework
- **Multer**: File upload handling
- **pptx-automizer**: PowerPoint manipulation library
- **AI SDKs**: OpenAI, Anthropic, Google AI integration

### Key Components
1. **Text Analyzer**: Processes input text and generates slide structure
2. **Template Parser**: Extracts styling and layout from PowerPoint templates
3. **Presentation Builder**: Creates new presentations with preserved styling
4. **LLM Manager**: Handles multiple AI provider integrations

## Testing

### Running Tests
```bash
npm test                    # Run all tests
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
npm run test:e2e          # End-to-end tests
```

### Test Categories
- **Unit Tests**: Individual component testing
- **Integration Tests**: API endpoint and service testing
- **E2E Tests**: Full user workflow testing

### Adding Tests
- Create test files alongside source files
- Use Jest for testing framework
- Mock external API calls appropriately
- Test both success and error scenarios

## Security Considerations

### API Key Handling
- Never log or store user API keys
- Use secure transmission methods
- Implement proper error handling
- Clear sensitive data from memory

### File Upload Security
- Validate file types and sizes
- Sanitize file contents
- Implement rate limiting
- Use secure temporary file handling

## Performance Guidelines

### Frontend Optimization
- Minimize bundle size and dependencies
- Implement efficient file processing
- Use progressive loading for large files
- Optimize for mobile devices

### Backend Optimization
- Implement caching where appropriate
- Use streaming for large file operations
- Monitor memory usage during processing
- Optimize AI API usage and costs

## Documentation Standards

### Code Documentation
- Use JSDoc for function documentation
- Include parameter and return type information
- Provide usage examples for public APIs
- Document error conditions and handling

### User Documentation
- Write clear, step-by-step instructions
- Include screenshots and examples
- Address common use cases and problems
- Keep documentation updated with code changes

## Community Guidelines

### Code of Conduct
- Be respectful and inclusive
- Provide constructive feedback
- Help newcomers and answer questions
- Follow professional communication standards

### Review Process
- All contributions require review before merging
- Provide detailed, helpful feedback
- Focus on code quality and user experience
- Consider security and performance implications

## Release Process

### Version Management
- Follow semantic versioning (SemVer)
- Tag releases appropriately
- Maintain changelog for user-facing changes
- Test thoroughly before releases

### Deployment
- Automated deployment through CI/CD
- Staging environment for testing
- Rollback procedures for issues
- Monitor post-deployment metrics

## Getting Help

### Resources
- [GitHub Issues](https://github.com/yourusername/textoslides/issues)
- [Discussions](https://github.com/yourusername/textoslides/discussions)
- [Technical Documentation](docs/)
- [FAQ](FAQ.md)

### Contact
- Create an issue for bug reports and feature requests
- Use discussions for general questions and ideas
- Email maintainers for security-related issues

Thank you for contributing to TextToSlides! Your efforts help make presentation creation easier and more accessible for everyone.
