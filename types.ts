
export interface ProcessedFile {
  id: string;
  file: File;
  type: 'excel' | 'image';
  preview?: string; // For images
  parsedText?: string; // For Excel data converted to string
}

export interface Transaction {
  description: string;
  amount: number;
  category: string;
  date?: string;
  originalSource: string;
}

export interface CategorySummary {
  category: string;
  totalAmount: number;
  percentage: number;
  transactionCount: number;
}

export enum AppStatus {
  IDLE = 'IDLE',
  PROCESSING_FILES = 'PROCESSING_FILES',
  ANALYZING = 'ANALYZING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export const DEFAULT_CATEGORIES = [
  "Salary",
  "Investments + EMI",
  "Rent & Maintenance",
  "Food & Groceries",
  "Utilities",
  "Miscellaneous"
];
