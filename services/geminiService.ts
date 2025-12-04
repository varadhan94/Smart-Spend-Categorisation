
import { GoogleGenAI, Type } from "@google/genai";
import { ProcessedFile, Transaction, DEFAULT_CATEGORIES } from "../types";
import { readFileAsBase64 } from "../utils/fileHelpers";

// Initialize Gemini Client
const getClient = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error("API Key is missing. Please ensure process.env.API_KEY is available.");
    }
    return new GoogleGenAI({ apiKey });
};

export const analyzeTransactions = async (
  files: ProcessedFile[], 
  customCategories: string[] = DEFAULT_CATEGORIES
): Promise<Transaction[]> => {
  const ai = getClient();
  
  // 1. Prepare Text Data (Excel contents)
  let textContext = "Here is the raw text extracted from the uploaded Excel/CSV files:\n\n";
  files.filter(f => f.type === 'excel').forEach(f => {
    textContext += `${f.parsedText}\n\n`;
  });

  // 2. Prepare Image Data
  const imageParts: any[] = [];
  const imageFiles = files.filter(f => f.type === 'image');
  
  for (const img of imageFiles) {
    const base64Data = await readFileAsBase64(img.file);
    imageParts.push({
      inlineData: {
        mimeType: img.file.type,
        data: base64Data
      }
    });
  }

  // Calculate Target Month (Previous Month)
  const today = new Date();
  // Go back one month from today to get the target billing period
  const targetDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const targetMonthName = targetDate.toLocaleString('default', { month: 'long' });
  const targetYear = targetDate.getFullYear();
  const targetPeriodStr = `${targetMonthName} ${targetYear}`;

  // 3. Construct the Prompt
  const prompt = `
    You are an expert financial assistant and accountant. 
    
    OBJECTIVE:
    Analyze the provided Excel text data and Image data.
    Extract individual transactions. 
    
    *** CRITICAL DATE FILTERING RULE ***
    Today's Date: ${today.toDateString()}
    TARGET PROCESSING PERIOD: ${targetPeriodStr} (The Previous Month)
    
    INSTRUCTION:
    1. Look at the date of each transaction.
    2. ONLY include transactions that occurred in ${targetPeriodStr}.
    3. DROP/IGNORE any transactions from ${today.toLocaleString('default', { month: 'long' })} (Current Month) or months prior to ${targetMonthName}.
    4. If a statement includes multiple months, filter STRICTLY for ${targetPeriodStr}.
    
    CATEGORIZATION RULES:
    Categorize each transaction into exactly one of the following categories:
    ${JSON.stringify(customCategories)}
    
    SPECIAL MAPPING RULES (Highest Priority):
    1. "Javis technologies" -> "Salary"
    2. "Monthly Savings Interest" -> "Salary"
    3. "Vidhya Viswanathan" -> "Rent & Maintenance"
    4. "Cash withdrawal" -> "Utilities"
    
    COMPLEX LOGIC RULES (Apply Strictly):
    1. "Vaarsheniee":
       - CHECK DATE: Is the transaction date between the 1st and the 5th of the ${targetPeriodStr}?
       - YES -> Category: "Investments + EMI".
       - NO  -> IGNORE/EXCLUDE this transaction completely.
    
    EXCLUSION RULES (Drop/Ignore these transactions):
    1. Description contains "Axis Bank Limited" (Credit card payment).
    2. Description contains "Ift/" followed by numbers (e.g., "Ift/123489...").
    3. Description contains "MB/IB Payment" or "MB-IB Payment" (Credit card/Bank payment).
    4. Generic "Payment Received", "Thank You", "Auto Debit".
    
    CATEGORY DEFINITIONS & MERGING:
    - "Food & Groceries": Include all supermarkets, vegetable vendors, and general grocery shopping here.
    - "Utilities": This is a broad bucket. MERGE all Shopping (Amazon, Flipkart), Transportation (Uber, Ola, Fuel), Health & Wellness (Pharmacy, Doctors), Cash withdrawals, and standard utility bills (Electricity, Internet) into this category.
    - "Rent & Maintenance": Housing costs (specifically payments to Vidhya Viswanathan).
    - "Miscellaneous": Any transaction that does not fit into Salary, Investments + EMI, Rent, Food, or Utilities.
    
    DATA INTERPRETATION & SIGN LOGIC (CRITICAL):
    
    STEP 1: DETERMINE EFFECTIVE AMOUNT
    Check if the data has a single 'Amount' column or separate 'Debit' and 'Credit' columns.
    - CASE A: Separate 'Debit' and 'Credit' columns (values are usually positive numbers).
      > Effective Amount = Credit - Debit
      > Example: Debit 300, Credit 0 -> Effective Amount is -300.
      > Example: Debit 0, Credit 300 -> Effective Amount is +300.
    - CASE B: Single 'Amount' column.
      > Effective Amount = The value in the column.
      
    STEP 2: APPLY LOGIC TO EFFECTIVE AMOUNT
    Use the 'Effective Amount' calculated above for the following rules:
    
    1. IF EFFECTIVE AMOUNT IS NEGATIVE (e.g. -3000):
       - This is an EXPENSE (or Investment). 
       - RETURN as a POSITIVE number (e.g. 3000).
    
    2. IF EFFECTIVE AMOUNT IS POSITIVE (e.g. 3000):
       - CHECK: Is it "Javis technologies" OR "Monthly Savings Interest"? 
         -> YES: It is INCOME. Return as POSITIVE number (3000). Category: Salary.
       - CHECK: Is it a Credit Card Bill Payment or matches EXCLUSION RULES above?
         -> YES: IGNORE/EXCLUDE this row completely. Do not output it.
       - CHECK: Is it a Refund/Reversal (e.g. "Starbucks Reversal", matching a merchant)?
         -> YES: It is an OFFSET. Return as a NEGATIVE number (e.g. -3000).
    
    GENERAL RULES:
    1. Identify the 'Description', 'Amount', and 'Date' for each transaction.
    2. Return the data as a clean JSON array.
    3. 'originalSource' should be the filename or 'Image' or 'Excel'.

    DATA SOURCES:
    ${textContext}
  `;

  // 4. Call Gemini
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          ...imageParts,
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              description: { type: Type.STRING },
              amount: { type: Type.NUMBER },
              category: { type: Type.STRING },
              date: { type: Type.STRING, description: "YYYY-MM-DD format if available, else empty" },
              originalSource: { type: Type.STRING }
            },
            required: ["description", "amount", "category"]
          }
        }
      }
    });

    const resultText = response.text;
    if (!resultText) throw new Error("No response from AI");

    const transactions: Transaction[] = JSON.parse(resultText);
    return transactions;

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
