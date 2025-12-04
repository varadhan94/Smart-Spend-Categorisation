import * as XLSX from 'xlsx';
import { ProcessedFile } from '../types';

export const readFileAsBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const parseExcelFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        
        let allText = `File: ${file.name}\n`;
        
        workbook.SheetNames.forEach(sheetName => {
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          allText += `Sheet: ${sheetName}\n`;
          allText += JSON.stringify(jsonData);
          allText += '\n---\n';
        });
        
        resolve(allText);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsBinaryString(file);
  });
};

export const processFiles = async (files: File[]): Promise<ProcessedFile[]> => {
  const processed: ProcessedFile[] = [];

  for (const file of files) {
    const id = Math.random().toString(36).substring(7);
    
    if (file.type.includes('image')) {
      const preview = URL.createObjectURL(file);
      processed.push({ id, file, type: 'image', preview });
    } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv')) {
      try {
        const parsedText = await parseExcelFile(file);
        processed.push({ id, file, type: 'excel', parsedText });
      } catch (e) {
        console.error("Failed to parse excel", e);
        // Still add it, but maybe mark as error or just send file name
        processed.push({ id, file, type: 'excel', parsedText: `Error parsing content of ${file.name}` });
      }
    }
  }

  return processed;
};