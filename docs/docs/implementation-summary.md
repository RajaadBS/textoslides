# TextToSlides: Text Processing and Style Application

## How Input Text is Parsed and Mapped to Slides

TextToSlides employs a sophisticated multi-stage AI approach to transform unstructured text into presentation-ready slides. The process begins with text preprocessing, where the system normalizes formatting, detects existing structure (markdown headers, bullet points), and calculates content metrics to estimate optimal slide count.

The core analysis leverages Large Language Models through carefully engineered prompts. In the first stage, the LLM extracts main themes, supporting points, data elements, and natural content flow from the input text. The optional guidance parameter (e.g., "investor pitch deck") influences this analysis to align with specific presentation styles.

The second stage generates a detailed slide structure, determining optimal slide count (typically 3-15), assigning content hierarchy, and selecting appropriate slide types (title, content, comparison, conclusion). An intelligent mapping algorithm then distributes content evenly across slides while maintaining narrative coherence and optimizing for visual consumption.

## How Visual Style and Assets are Applied

Template style preservation occurs through comprehensive PowerPoint file analysis. The system extracts the uploaded template as a ZIP archive and parses OpenXML components to retrieve theme colors, font schemes, layout structures, and embedded images.

The template analyzer identifies color palettes (theme colors, accent colors, text colors), typography systems (major and minor fonts with hierarchies), and slide master layouts with their placeholder arrangements. Visual assets like logos and graphics are catalogued for potential reuse.

During presentation generation, the system applies extracted styles through intelligent content-to-layout matching. Each generated slide is assigned an appropriate template layout based on content type. The styling engine then applies theme colors to text elements, preserves font hierarchies, and maintains consistent spacing and alignment patterns.

Images from the original template are strategically reused based on contextual relevance, ensuring visual continuity. The final presentation maintains the template's complete visual identity while presenting the AI-generated content in a professionally structured format that respects both the original text's intent and the template's design aesthetic.
