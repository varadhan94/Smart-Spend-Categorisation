import React, { useState } from 'react';
import { Sparkles, Loader2, AlertCircle } from 'lucide-react';
import DropZone from './components/DropZone';
import ResultsView from './components/ResultsView';
import { processFiles } from './utils/fileHelpers';
import { analyzeTransactions } from './services/geminiService';
import { ProcessedFile, AppStatus, Transaction } from './types';

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [files, setFiles] = useState<ProcessedFile[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFilesAdded = async (newFiles: File[]) => {
    setStatus(AppStatus.PROCESSING_FILES);
    setErrorMessage(null);
    try {
      const processed = await processFiles(newFiles);
      setFiles(prev => [...prev, ...processed]);
      setStatus(AppStatus.IDLE);
    } catch (err) {
      console.error(err);
      setErrorMessage("Failed to process some files. Please check format.");
      setStatus(AppStatus.IDLE);
    }
  };

  const removeFile = (id: string) => {
    setFiles(files.filter(f => f.id !== id));
  };

  const handleCategorize = async () => {
    if (files.length === 0) return;
    
    setStatus(AppStatus.ANALYZING);
    setErrorMessage(null);
    
    try {
      const result = await analyzeTransactions(files);
      setTransactions(result);
      setStatus(AppStatus.COMPLETED);
    } catch (err) {
      console.error(err);
      setErrorMessage("AI Processing Failed. Please check your API key and file contents.");
      setStatus(AppStatus.ERROR);
    }
  };

  const reset = () => {
    setFiles([]);
    setTransactions([]);
    setStatus(AppStatus.IDLE);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
              Smart Spend Categorizer
            </h1>
          </div>
          <div className="text-sm text-slate-500 hidden sm:block">
            Powered by Gemini 2.5 Flash
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Intro Section (only visible when no results) */}
        {status !== AppStatus.COMPLETED && (
          <div className="text-center mb-10 max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl mb-4">
              Automate your monthly expense tracking
            </h2>
            <p className="text-lg text-slate-600 leading-relaxed">
              Upload your Excel bank statements and screenshots of credit card bills. 
              Our AI agent will extract, merge, and categorize everything for you instantly.
            </p>
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className="max-w-3xl mx-auto mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-red-700 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <p>{errorMessage}</p>
          </div>
        )}

        {/* Input Phase */}
        {status !== AppStatus.COMPLETED && (
          <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
             <div className="p-8">
                <DropZone 
                  onFilesAdded={handleFilesAdded} 
                  processedFiles={files} 
                  onRemoveFile={removeFile}
                  disabled={status === AppStatus.ANALYZING}
                />
                
                <div className="mt-8 flex justify-end">
                  <button
                    onClick={handleCategorize}
                    disabled={files.length === 0 || status === AppStatus.ANALYZING}
                    className={`
                      flex items-center gap-2 px-8 py-3 rounded-lg font-semibold text-white shadow-lg shadow-indigo-200
                      transition-all transform active:scale-95
                      ${files.length === 0 || status === AppStatus.ANALYZING
                        ? 'bg-slate-300 cursor-not-allowed shadow-none' 
                        : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 hover:-translate-y-0.5'}
                    `}
                  >
                    {status === AppStatus.ANALYZING ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Analyzing with Gemini...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Categorize Transactions
                      </>
                    )}
                  </button>
                </div>
             </div>
             
             {/* Info Footer within card */}
             <div className="bg-slate-50 px-8 py-4 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
                <span>Supported: .xlsx, .csv, .png, .jpg</span>
                <span>Secure client-side processing</span>
             </div>
          </div>
        )}

        {/* Results Phase */}
        {status === AppStatus.COMPLETED && (
          <ResultsView transactions={transactions} onReset={reset} />
        )}
      </main>
    </div>
  );
};

export default App;