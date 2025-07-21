#!/usr/bin/env python3
"""
PDF Reader Script for Avenia API Documentation
Extracts text from PDF files in the docs folder to help create API calls
"""

import os
import sys
from pathlib import Path

try:
    import PyPDF2
except ImportError:
    print("PyPDF2 not installed. Install with: pip install PyPDF2")
    sys.exit(1)

def read_pdf(pdf_path):
    """Extract text from a PDF file"""
    try:
        with open(pdf_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            text = ""
            
            for page_num in range(len(pdf_reader.pages)):
                page = pdf_reader.pages[page_num]
                text += f"\n--- Page {page_num + 1} ---\n"
                text += page.extract_text()
            
            return text
    except Exception as e:
        return f"Error reading PDF: {str(e)}"

def main():
    docs_dir = Path(__file__).parent
    pdf_files = list(docs_dir.glob("*.pdf"))
    
    if not pdf_files:
        print("No PDF files found in the docs directory")
        return
    
    for pdf_file in pdf_files:
        print(f"\n{'='*60}")
        print(f"Reading: {pdf_file.name}")
        print(f"{'='*60}")
        
        text = read_pdf(pdf_file)
        
        # Create output file for extracted text
        output_file = docs_dir / f"{pdf_file.stem}_extracted.txt"
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(text)
        
        print(f"Text extracted to: {output_file}")
        print(text)  # Print all text content

if __name__ == "__main__":
    main()