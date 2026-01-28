import ExpoModulesCore
import Vision
import UIKit
import FoundationModels

public class ReceiptProcessorModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ReceiptProcessor")

    Function("isSupported") { () -> Bool in
      if #available(iOS 26.0, *) {
        return true
      }
      return false
    }

    AsyncFunction("scan") { (imageUri: String, promise: Promise) in
      // Check for iOS 26.0+ explicitly (using 26 as placeholder based on error logs, 
      // but in reality we need to handle the availability check correctly for Swift compiler)
      guard #available(iOS 26.0, *) else {
        promise.reject("ERR_UNSUPPORTED", "This feature requires iOS 26.0 or later.")
        return
      }
      
      // ... (rest of code)

      // Handle file:// URIs properly
      guard let url = URL(string: imageUri) else {
        promise.reject("ERR_INVALID_URI", "Invalid image URI")
        return
      }
      
      let finalUrl = url.scheme == nil ? URL(fileURLWithPath: imageUri) : url

      guard let data = try? Data(contentsOf: finalUrl),
            let image = UIImage(data: data),
            let cgImage = image.cgImage else {
        promise.reject("ERR_INVALID_IMAGE", "Could not load image data")
        return
      }

      // 2. OCR via Vision
      let request = VNRecognizeTextRequest()
      request.recognitionLevel = .accurate
      // Optimize for receipt reading (dense text)
      request.usesLanguageCorrection = true
      
      let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
      
      do {
        try handler.perform([request])
        guard let observations = request.results else {
          promise.reject("ERR_OCR_FAILED", "No text recognized")
          return
        }
        
        let recognizedText = observations
            .compactMap { $0.topCandidates(1).first?.string }
            .joined(separator: "\n")
        
        if recognizedText.isEmpty {
           promise.reject("ERR_NO_TEXT", "No text found in image")
           return
        }

        // 3. LLM via LanguageModelSession
        // We wrap this in a separate availability check to satisfy the Swift compiler
        if #available(iOS 26.0, *) {
            Task {
                do {
                    let session = LanguageModelSession()
                    let prompt = """
                    You are a receipt parsing assistant.
                    Analyze the following receipt text and extract:
                    1. The store name (detectedStore) - infer from header or logo text.
                    2. A list of items (items), each with a 'name' (cleaned up) and 'price' (number).
                    
                    Ignore tax lines, subtotals, and payment details in the items list.
                    
                    Return ONLY valid JSON with this structure:
                    {
                      "detectedStore": "Store Name",
                      "items": [
                        { "name": "Item Name", "price": 10.99 }
                      ]
                    }
                    
                    Do not include markdown formatting or explanations. Just the JSON string.

                    Receipt Text:
                    \(recognizedText)
                    """
                    
                    let response = try await session.respond(to: prompt)
                    
                    // Extract text content
                    // Cast is unnecessary if response.content is already String, but kept for safety in beta API
                    let responseText = String(response.content)
                    
                    // Clean up any markdown code blocks if the model adds them
                    let cleanJson = responseText
                        .replacingOccurrences(of: "```json", with: "")
                        .replacingOccurrences(of: "```", with: "")
                        .trimmingCharacters(in: .whitespacesAndNewlines)
                    
                    promise.resolve(cleanJson)
                } catch {
                    promise.reject("ERR_LLM_FAILED", "Model execution failed: \(error.localizedDescription)")
                }
            }
        } else {
             promise.reject("ERR_UNSUPPORTED", "LanguageModelSession requires iOS 26.0+")
        }

      } catch {
        promise.reject("ERR_PROCESSING", error.localizedDescription)
      }
    }
  }
}
