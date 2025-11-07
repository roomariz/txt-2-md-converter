import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders main application title', () => {
  render(<App />);
  const titleElement = screen.getByText(/Txt2MD Converter/i);
  expect(titleElement).toBeInTheDocument();
});

test('renders upload instructions', () => {
  render(<App />);
  const instructionElement = screen.getByText(/Drag 'n' drop .txt, .doc, or .docx files here/i);
  expect(instructionElement).toBeInTheDocument();
});
