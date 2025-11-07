const fs = require('fs');
const path = './src/App.tsx';
let content = fs.readFileSync(path, 'utf8');

// Define the original function (as it currently exists)
const originalFunction = `  const convertToMarkdown = (text: string): string => {
    // Add metadata at the top
    let markdown = \`---
converted: true
date: \${new Date().toISOString().split('T')[0]}
---

\`;

    const lines = text.split('\\n');
    let inCodeBlock = false;
    let codeBlockContent = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Check if it's the first line and capitalize it as a heading
      if (i === 0 && line) {
        markdown += \`# \${line}\\n\\n\`;
        continue;
      }

      // Detect code blocks (indented with 4+ spaces or tabs)
      if ((lines[i].startsWith('    ') || lines[i].startsWith('\\\\t')) && !inCodeBlock) {
        inCodeBlock = true;
        codeBlockContent = lines[i].replace(/^\\\\t/, '    ').replace(/^    /, '');
        continue;
      }

      if (inCodeBlock) {
        if (lines[i].startsWith('    ') || lines[i].startsWith('\\\\t')) {
          codeBlockContent += '\\n' + lines[i].replace(/^\\\\t/, '    ').replace(/^    /, '');
          continue;
        } else {
          markdown += '\`\`\`\\n' + codeBlockContent + '\\n\`\`\`\\n\\n';
          inCodeBlock = false;
          codeBlockContent = '';
        }
      }

      // Detect numbered lists
      if (/^\\\\d+\\\\.\\\\s/.test(line)) {
        markdown += line.replace(/^\\\\d+\\\\.\\\\s/, '1. ') + '\\n';
        continue;
      }

      // Detect bullet points
      if (/^[\\\\-\\\\*\\\\+]\s/.test(line)) {
        markdown += line.replace(/^[\\\\-\\\\*\\\\+]\s/, '* ') + '\\n';
        continue;
      }

      // Detect headings (lines that look like headings - all caps or title case)
      if (line === line.toUpperCase() && line.length < 100 && !line.includes(' ')) {
        markdown += \`## \${line}\\n\\n\`;
        continue;
      }

      // Add paragraph break for empty lines
      if (line === '') {
        if (i < lines.length - 1) { // Don't add extra newlines at the end
          markdown += '\\n';
        }
        continue;
      }

      // Add regular text
      markdown += line + '\\n';
    }

    // Close any remaining code block
    if (inCodeBlock) {
      markdown += '\`\`\`\\n' + codeBlockContent + '\\n\`\`\`\\n';
    }

    return markdown;
  };`;

// Define the new function (with proper escaping)
const newFunction = `  const convertToMarkdown = (text: string): string => {
    // Add metadata at the top
    let markdown = \`---
converted: true
date: \${new Date().toISOString().split('T')[0]}
---

\`;

    const lines = text.split('\\n');
    let inCodeBlock = false;
    let codeBlockContent = '';
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];
      const trimmedLine = line.trim();

      // Check if it's the first non-empty line and use it as a heading
      if (i === 0 && trimmedLine) {
        markdown += \`# \${trimmedLine}\\n\\n\`;
        i++;
        continue;
      }

      // Skip completely empty lines but preserve paragraph breaks
      if (!trimmedLine) {
        if (inCodeBlock) {
          codeBlockContent += '\\n';
        } else {
          markdown += '\\n';
        }
        i++;
        continue;
      }

      // Detect code blocks (indented with 4+ spaces or tabs)
      if ((line.startsWith('    ') || line.startsWith('\\\\t')) && !inCodeBlock) {
        inCodeBlock = true;
        codeBlockContent = line.replace(/^\\\\t/, '    ').replace(/^    /, '');
        i++;
        continue;
      }

      if (inCodeBlock) {
        if (line.startsWith('    ') || line.startsWith('\\\\t')) {
          codeBlockContent += '\\n' + line.replace(/^\\\\t/, '    ').replace(/^    /, '');
          i++;
          continue;
        } else {
          markdown += '\`\`\`\\n' + codeBlockContent + '\\n\`\`\`\\n\\n';
          inCodeBlock = false;
          codeBlockContent = '';
          // Don't increment i, process the current line again without the code block context
          continue;
        }
      }

      // Detect and handle numbered lists (e.g., "1. text", "2. text", etc.)
      const numberedListItem = trimmedLine.match(/^(\d+)\\\\.\\\\s+(.+)\$/);
      if (numberedListItem) {
        markdown += \`\${numberedListItem[1]}. \${numberedListItem[2]}\\n\`;
        i++;
        continue;
      }

      // Detect and handle bullet points
      const bulletPoint = trimmedLine.match(/^[\\\\-\\\\*\\\\+]\\\\s+(.+)\$/);
      if (bulletPoint) {
        markdown += \`* \${bulletPoint[1]}\\n\`;
        i++;
        continue;
      }

      // Detect potential heading patterns (all caps, short lines, or lines ending with colons)
      if (
        (trimmedLine === trimmedLine.toUpperCase() && trimmedLine.length < 100 && !trimmedLine.includes(' ')) ||
        (trimmedLine.endsWith(':') && trimmedLine.length < 100)
      ) {
        markdown += \`## \${trimmedLine}\\n\\n\`;
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
        markdown += \`## \${trimmedLine}\\n\\n\`;
        i++;
        continue;
      }

      // Add regular text paragraphs
      markdown += trimmedLine + '\\n';
      i++;
    }

    // Close any remaining code block
    if (inCodeBlock) {
      markdown += '\`\`\`\\n' + codeBlockContent + '\\n\`\`\`\\n';
    }

    // Final cleanup: remove any duplicate newlines
    markdown = markdown.replace(/\\n{3,}/g, '\\n\\n');
    
    return markdown;
  };`;

// Replace the original function with the new one
content = content.replace(originalFunction, newFunction);

fs.writeFileSync(path, content);
console.log('Function successfully updated!');