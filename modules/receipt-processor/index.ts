import { requireNativeModule } from 'expo-modules-core';

// Define the shape of the parsed result
export type ProcessedReceipt = {
  items: { name: string; price: number }[];
  detectedStore?: string;
};

// Interface for the native module
interface ReceiptProcessorModule {
  isSupported(): boolean;
  scan(imageUri: string): Promise<string>;
}

// Load the native module
const ReceiptProcessor = requireNativeModule<ReceiptProcessorModule>('ReceiptProcessor');

export async function scanReceipt(imageUri: string): Promise<ProcessedReceipt> {
  try {
    const jsonString = await ReceiptProcessor.scan(imageUri);
    const parsed = JSON.parse(jsonString);
    return parsed as ProcessedReceipt;
  } catch (error) {
    console.error('ReceiptProcessor scan error:', error);
    throw error;
  }
}

export function isSupported(): boolean {
  return ReceiptProcessor.isSupported();
}
