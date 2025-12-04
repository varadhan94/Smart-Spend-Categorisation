import React, { useCallback } from 'react';
import { Upload, FileSpreadsheet, Image as ImageIcon, X } from 'lucide-react';
import { ProcessedFile } from '../types';

interface DropZoneProps {
  onFilesAdded: (files: File[]) => void;
  processedFiles: ProcessedFile[];
  onRemoveFile: (id: string) => void;
  disabled: boolean;
}

const DropZone: React.FC<DropZoneProps> = ({ onFilesAdded, processedFiles, onRemoveFile, disabled }) => {
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;
    const droppedFiles = Array.from(e.dataTransfer.files);
    onFilesAdded(droppedFiles);
  }, [onFilesAdded, disabled]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled || !e.target.files) return;
    onFilesAdded(Array.from(e.target.files));
  };

  return (
    <div className="w-full">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          disabled ? 'opacity-50 cursor-not-allowed border-gray-200' : 'border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50/30'
        } bg-white`}
      >
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="p-4 bg-indigo-50 rounded-full">
            <Upload className="w-8 h-8 text-indigo-600" />
          </div>
          <div>
            <p className="text-lg font-medium text-gray-700">Drag & drop statements here</p>
            <p className="text-sm text-gray-500 mt-1">Excel (.xlsx, .csv) or Images (Screenshots)</p>
          </div>
          
          <label className={`px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer ${disabled ? 'pointer-events-none' : ''}`}>
            Browse Files
            <input 
              type="file" 
              multiple 
              className="hidden" 
              onChange={handleChange}
              accept=".xlsx,.xls,.csv,.jpg,.jpeg,.png,.webp"
              disabled={disabled}
            />
          </label>
        </div>
      </div>

      {processedFiles.length > 0 && (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {processedFiles.map((file) => (
            <div key={file.id} className="relative group flex items-center p-3 bg-white border border-gray-100 rounded-lg shadow-sm">
              <div className="p-2 bg-gray-50 rounded mr-3">
                {file.type === 'image' ? (
                  <ImageIcon className="w-5 h-5 text-purple-500" />
                ) : (
                  <FileSpreadsheet className="w-5 h-5 text-green-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 truncate">{file.file.name}</p>
                <p className="text-xs text-gray-400">{(file.file.size / 1024).toFixed(1)} KB</p>
              </div>
              <button
                onClick={() => onRemoveFile(file.id)}
                disabled={disabled}
                className="p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DropZone;