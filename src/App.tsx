import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import MarkdownPreview from './components/MarkdownPreview';
import JSZip from 'jszip';
import * as mammoth from 'mammoth';
import TurndownService from 'turndown';
import './App.css';

const App: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [convertedMarkdown, setConvertedMarkdown] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const convertDocxToMarkdown = useCallback(async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    
    // Use mammoth to convert DOCX to HTML, preserving formatting
    const result = await mammoth.convertToHtml({ arrayBuffer });
    
    // Use turndown to convert the HTML to Markdown
    const turndownService = new TurndownService({
      headingStyle: 'atx',  // Use # for headings
      hr: '---',
      bulletListMarker: '*',
      codeBlockStyle: 'fenced',
      emDelimiter: '*',
      strongDelimiter: '**',
      linkStyle: 'inlined',
      linkReferenceStyle: 'full'
    });
    
    let markdown = turndownService.turndown(result.value);
    
    // Add metadata at the top (YAML frontmatter)
    markdown = `---
converted: true
date: ${new Date().toISOString().split('T')[0]}
---

${markdown}`;
    
    return markdown;
  }, []);

  const convertToMarkdown = useCallback((text: string): string => {
    // Process text files to detect basic formatting patterns
    const lines = text.split('\n');
    let inCodeBlock = false;
    let codeBlockContent = '';
    let i = 0;

    let markdown = '';

    while (i < lines.length) {
      const line = lines[i];
      const trimmedLine = line.trim();

      // Skip completely empty lines but preserve paragraph breaks
      if (!trimmedLine) {
        if (inCodeBlock) {
          codeBlockContent += '\n';
        } else {
          markdown += '\n';
        }
        i++;
        continue;
      }

      // Detect code blocks (indented with 4+ spaces or tabs)
      if ((line.startsWith('    ') || line.startsWith('\t')) && !inCodeBlock) {
        inCodeBlock = true;
        codeBlockContent = line.replace(/^\t/, '    ').replace(/^    /, '');
        i++;
        continue;
      }

      if (inCodeBlock) {
        if (line.startsWith('    ') || line.startsWith('\t')) {
          codeBlockContent += '\n' + line.replace(/^\t/, '    ').replace(/^    /, '');
          i++;
          continue;
        } else {
          markdown += '```\n' + codeBlockContent + '\n```\n\n';
          inCodeBlock = false;
          codeBlockContent = '';
          // Don't increment i, process the current line again without the code block context
          continue;
        }
      }

      // Detect and handle numbered lists (e.g., "1. text", "2. text", etc.)
      const numberedListItem = trimmedLine.match(/^(\d+)\.\s+(.+)$/);
      if (numberedListItem) {
        markdown += `${numberedListItem[1]}. ${numberedListItem[2]}\n`;
        i++;
        continue;
      }

      // Detect and handle bullet points
      const bulletPoint = trimmedLine.match(/^[-*+]\s+(.+)$/);
      if (bulletPoint) {
        markdown += `* ${bulletPoint[1]}\n`;
        i++;
        continue;
      }

      // Detect potential heading patterns (all caps, short lines, or lines ending with colons)
      if (
        (trimmedLine === trimmedLine.toUpperCase() && trimmedLine.length < 100 && !trimmedLine.includes(' ')) ||
        (trimmedLine.endsWith(':') && trimmedLine.length < 100)
      ) {
        markdown += `## ${trimmedLine}\n\n`;
        i++;
        continue;
      }

      // Handle lines that look like headings but aren't all caps
      if (
        trimmedLine.length < 100 &&
        /^[A-Z]/.test(trimmedLine) &&
        !trimmedLine.includes('.') &&
        !trimmedLine.startsWith('1. ') &&
        !trimmedLine.startsWith('2. ') &&
        !trimmedLine.startsWith('3. ') &&
        !trimmedLine.startsWith('4. ') &&
        !trimmedLine.startsWith('5. ') &&
        !trimmedLine.startsWith('6. ') &&
        !trimmedLine.startsWith('7. ') &&
        !trimmedLine.startsWith('8. ') &&
        !trimmedLine.startsWith('9. ') &&
        !trimmedLine.startsWith('* ') &&
        !trimmedLine.startsWith('- ') &&
        !trimmedLine.startsWith('+ ')
      ) {
        markdown += `## ${trimmedLine}\n\n`;
        i++;
        continue;
      }

      // Add regular text paragraphs
      markdown += trimmedLine + '\n';
      i++;
    }

    // Close any remaining code block
    if (inCodeBlock) {
      markdown += '```\n' + codeBlockContent + '\n```\n';
    }

    // Final cleanup: remove any duplicate newlines
    markdown = markdown.replace(/\n{3,}/g, '\n\n');

    return markdown;
  }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError(null);
    setFiles(prevFiles => [...prevFiles, ...acceptedFiles]);

    // Auto-convert the first file if only one was added
    if (acceptedFiles.length === 1) {
      convertFile(acceptedFiles[0]);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    multiple: true
  });

  const convertFile = useCallback(async (file: File) => {
    setIsLoading(true);
    try {
      let markdown: string;

      if (file.type === 'application/msword' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        // Handle .doc and .docx files - these are converted directly to markdown preserving formatting
        markdown = await convertDocxToMarkdown(file);
      } else {
        // Handle .txt files
        const text = await file.text();
        let processedText = convertToMarkdown(text);
        
        // Add metadata at the top (YAML frontmatter) for text files
        markdown = `---
converted: true
date: ${new Date().toISOString().split('T')[0]}
---

${processedText}`;
      }

      setConvertedMarkdown(markdown);
    } catch (err) {
      setError('Failed to convert file: ' + (err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [convertToMarkdown, setError, setConvertedMarkdown, setIsLoading, convertDocxToMarkdown]);

  const convertMultipleFiles = async () => {
    if (files.length === 0) return;

    setIsLoading(true);
    try {
      const zip = new JSZip();

      for (const file of files) {
        let markdown: string;

        if (file.type === 'application/msword' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
          // Handle .doc and .docx files - these are converted directly to markdown preserving formatting
          markdown = await convertDocxToMarkdown(file);
        } else {
          // Handle .txt files
          const text = await file.text();
          let processedText = convertToMarkdown(text);
          
          // Add metadata at the top (YAML frontmatter) for text files
          markdown = `---
converted: true
date: ${new Date().toISOString().split('T')[0]}
---

${processedText}`;
        }

        // Properly handle the file extension replacement for .doc and .docx files
        const baseName = file.name.replace(/\.(txt|docx?|rtf)$/i, '');
        const filename = `${baseName}.md`;
        zip.file(filename, markdown);
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'converted-markdown-files.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to convert files: ' + (err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(prevFiles => [...prevFiles, ...newFiles]);

      // Auto-convert the first file if only one was selected
      if (newFiles.length === 1) {
        convertFile(newFiles[0]);
      }
    }
  };

  const removeFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);

    // If we removed the currently selected file, reset the preview
    if (index === 0 && newFiles.length > 0) {
      convertFile(newFiles[0]);
    } else if (newFiles.length === 0) {
      setConvertedMarkdown(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Txt2MD Converter</h1>
          <p className="mt-2 text-gray-600">Convert text and Word files to Markdown with automatic formatting</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Upload and File List */}
          <div className="space-y-6">
            {/* Upload Area */}
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
            >
              <input {...getInputProps()} />
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <p className="mt-2 text-sm text-gray-600">
                {isDragActive
                  ? "Drop the files here..."
                  : "Drag 'n' drop .txt, .doc, or .docx files here, or click to select files"}
              </p>
              <p className="text-xs text-gray-500 mt-1">Supports single or multiple file uploads</p>
            </div>

            {/* File Selection Alternative */}
            <div className="relative">
              <input
                type="file"
                id="file-input"
                className="hidden"
                multiple
                accept=".txt,.doc,.docx"
                onChange={handleFileSelect}
              />
              <label
                htmlFor="file-input"
                className="flex justify-center items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer"
              >
                Select Files
              </label>
            </div>

            {/* File List */}
            {files.length > 0 && (
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-4 py-5 sm:p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Selected Files ({files.length})</h2>
                  <ul className="divide-y divide-gray-200">
                    {files.map((file, index) => (
                      <li key={index} className="py-3 flex justify-between items-center">
                        <div className="flex items-center">
                          <svg
                            className="h-5 w-5 text-blue-500 mr-2"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                          </svg>
                          <span className="text-sm font-medium text-gray-900 truncate max-w-xs">{file.name}</span>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => convertFile(file)}
                            className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none"
                          >
                            Convert
                          </button>
                          <button
                            onClick={() => removeFile(index)}
                            className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none"
                          >
                            Remove
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">{error}</h3>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Preview */}
          <div className="space-y-6">
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-4 py-5 sm:p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Markdown Preview</h2>
                {isLoading ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                ) : convertedMarkdown ? (
                  <MarkdownPreview markdown={convertedMarkdown} />
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <p className="mt-4">Upload a text file to see the Markdown conversion preview</p>
                  </div>
                )}
              </div>
            </div>

            {/* Download Buttons */}
            <div className="flex flex-col space-y-4 items-center">
              {convertedMarkdown && (
                <button
                  onClick={() => {
                    const blob = new Blob([convertedMarkdown], { type: 'text/markdown' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    // Properly handle the file extension replacement for all supported file types
                    if (files[0]) {
                      const baseName = files[0].name.replace(/\.(txt|docx?|rtf)$/i, '');
                      a.download = `${baseName}.md`;
                    } else {
                      a.download = 'converted.md';
                    }
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                >
                  Download Current Markdown
                </button>
              )}
              {files.length > 1 && (
                <button
                  onClick={convertMultipleFiles}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none"
                >
                  Download All as ZIP
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;