# Txt2MD Converter

Convert text and Word documents to Markdown with preserved formatting. This web-based tool maintains the structure of your documents, including headings, subheadings, and bullet points, ensuring that your converted Markdown files look exactly as intended.

## 🎯 Features

- **Preserved Formatting**: Converts DOCX files while maintaining headings, subheadings, and bullet points
- **Multi-format Support**: Handles both text files (.txt) and Word documents (.docx)
- **Drag & Drop Interface**: Intuitive file upload with drag and drop functionality
- **Batch Processing**: Convert multiple files at once with ZIP download
- **Real-time Preview**: See your Markdown output before downloading
- **YAML Frontmatter**: Automatically adds metadata to converted files
- **Docker Support**: Run easily in containers for consistent deployment
- **Production Optimized**: Built with best practices for production environments

## 🚀 Quick Start

### Prerequisites

- Node.js (version 14 or later) and npm, OR
- Docker and Docker Compose

### Installation (Option 1: Traditional Method)

1. **Clone the repository**
   ```bash
   git clone https://github.com/roomariz/txt-2-md-converter.git
   cd txt-2-md-converter
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Open your browser** and visit `http://localhost:3000`

### Installation (Option 2: Docker Method)

1. **Clone the repository**
   ```bash
   git clone https://github.com/roomariz/txt-2-md-converter.git
   cd txt-2-md-converter
   ```

2. **Build and run with Docker Compose (recommended)**
   ```bash
   docker-compose up --build
   ```

3. **Open your browser** and visit `http://localhost:3000`

   The application will be available at `http://localhost:3000`

### Installation (Option 3: Manual Docker)

1. **Clone the repository**
   ```bash
   git clone https://github.com/roomariz/txt-2-md-converter.git
   cd txt-2-md-converter
   ```

2. **Build the Docker image**
   ```bash
   docker build -t txt2md-converter .
   ```

3. **Run the container**
   ```bash
   docker run -p 3000:3000 txt2md-converter
   ```

4. **Open your browser** and visit `http://localhost:3000`

### Running in Production

The Docker image is optimized for production use. To run in production mode:

```bash
docker-compose up --build -d  # detached mode
```

## 📖 Usage

### Single File Conversion
1. Drag and drop your .txt or .docx file onto the upload area
2. Wait for the conversion to complete
3. Review the Markdown preview
4. Click "Download Current Markdown" to save your file

### Batch Processing
1. Click "Select Files" to choose multiple files
2. Each file will be processed individually
3. Click "Download All as ZIP" to download all converted files

### File Support
- **Text Files**: `.txt` files with basic formatting detection
- **Word Documents**: `.docx` files with preserved formatting (headings, lists, etc.)

### Docker Deployment
When running via Docker, the application operates in production mode with optimized performance. The container exposes port 3000 and serves the static build files using the `serve` package.

## 🛠️ How It Works

The converter uses different approaches based on file type:

- **For .docx files**: Uses `mammoth.js` to preserve the original document structure, then converts HTML to Markdown using `turndown`
- **For .txt files**: Applies pattern matching to detect headings, lists, and other formatting elements

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes**
4. **Test your changes**
5. **Commit your changes**: `git commit -m 'Add amazing feature'`
6. **Push to the branch**: `git push origin feature/amazing-feature`
7. **Open a Pull Request**

### Development Setup
1. Install dependencies: `npm install`
2. Start development server: `npm start`
3. The app will automatically open in your browser at `http://localhost:3000`

### Project Structure
```
txt2md-converter/
├── public/              # Static assets
├── src/
│   ├── components/      # React components
│   ├── App.tsx          # Main application logic
│   └── ...              # Other source files
├── package.json         # Dependencies and scripts
└── README.md           # This file
```

## 📝 API Reference

### Supported File Types
- `text/plain`: .txt files
- `application/msword`: .doc files
- `application/vnd.openxmlformats-officedocument.wordprocessingml.document`: .docx files

### Output Format
The converter produces standard Markdown with optional YAML frontmatter containing:
- `converted: true`
- `date: YYYY-MM-DD` (conversion date)

## 🔧 Troubleshooting

### Common Issues
1. **File upload not working**: Make sure your file format is supported (.txt, .doc, .docx)
2. **Formatting not preserved**: Complex Word formatting might not translate perfectly to Markdown
3. **Large files**: Very large files might take longer to process

### Known Limitations
- Complex table formats in Word documents may not convert perfectly
- Some advanced formatting (text boxes, special fonts) won't be preserved
- Images are extracted as separate elements in Markdown

## 🎨 Customization

### Modifying Conversion Behavior
Edit `src/App.tsx` to change how different formatting elements are detected and converted.

### Adding New File Types
Update the file type detection in `useDropzone` configuration and add appropriate conversion functions.

## 📋 Version History

### 0.1.0
- Initial release with text and DOCX conversion capabilities
- Preserved formatting for Word documents
- Drag & drop interface
- Batch processing support

## 🤝 Support

If you encounter any issues or have questions:
1. Check the [Troubleshooting](#troubleshooting) section
2. Search existing [Issues](https://github.com/roomariz/txt-2-md-converter/issues)
3. Create a new issue with detailed information about your problem

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## ⭐ Show Your Support

If this tool helped you, please give it a star on GitHub and consider contributing to the project!

---

<div align="center">
Made with ❤️ for the community
</div>