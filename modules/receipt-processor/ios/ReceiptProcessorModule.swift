import ExpoModulesCore
import Vision
import UIKit
import FoundationModels
import CoreImage
import CoreImage.CIFilterBuiltins

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
      // Check for iOS 26.0+ explicitly
      guard #available(iOS 26.0, *) else {
        promise.reject("ERR_UNSUPPORTED", "This feature requires iOS 26.0 or later.")
        return
      }
      
      guard let url = URL(string: imageUri) else {
        promise.reject("ERR_INVALID_URI", "Invalid image URI")
        return
      }
      
      let finalUrl = url.scheme == nil ? URL(fileURLWithPath: imageUri) : url

      guard let data = try? Data(contentsOf: finalUrl),
            let uiImage = UIImage(data: data),
            let originalCgImage = uiImage.cgImage else {
        promise.reject("ERR_INVALID_IMAGE", "Could not load image data")
        return
      }

      // 1. Preprocessing: Detect and Crop Receipt
      var imageToProcess = originalCgImage
      
      let detectRequest = VNDetectDocumentSegmentationRequest()
      let detectHandler = VNImageRequestHandler(cgImage: originalCgImage, options: [:])
      
      // Try to find the document bounds
      try? detectHandler.perform([detectRequest])
      
      if let observation = detectRequest.results?.first {
          // We found a rectangle. Use Core Image to correct perspective.
          let ciImage = CIImage(cgImage: originalCgImage)
          let width = CGFloat(originalCgImage.width)
          let height = CGFloat(originalCgImage.height)
          
          // Convert normalized coordinates (0..1) to image coordinates (pixels)
          let topLeft = CIVector(x: observation.topLeft.x * width, y: observation.topLeft.y * height)
          let topRight = CIVector(x: observation.topRight.x * width, y: observation.topRight.y * height)
          let bottomLeft = CIVector(x: observation.bottomLeft.x * width, y: observation.bottomLeft.y * height)
          let bottomRight = CIVector(x: observation.bottomRight.x * width, y: observation.bottomRight.y * height)
          
          // Use string-based key for filter to ensure compatibility if CIFilterBuiltins is finicky
          if let filter = CIFilter(name: "CIPerspectiveCorrection") {
              filter.setValue(ciImage, forKey: kCIInputImageKey)
              filter.setValue(topLeft, forKey: "inputTopLeft")
              filter.setValue(topRight, forKey: "inputTopRight")
              filter.setValue(bottomLeft, forKey: "inputBottomLeft")
              filter.setValue(bottomRight, forKey: "inputBottomRight")
              
              if let outputImage = filter.outputImage {
                  // Optional: Enhance contrast and desaturate (binarization-lite)
                  if let colorFilter = CIFilter(name: "CIColorControls") {
                      colorFilter.setValue(outputImage, forKey: kCIInputImageKey)
                      colorFilter.setValue(1.1, forKey: kCIInputContrastKey) // Boost contrast
                      colorFilter.setValue(0.0, forKey: kCIInputSaturationKey) // Grayscale
                      
                      if let enhancedImage = colorFilter.outputImage {
                          let context = CIContext()
                          if let resultRef = context.createCGImage(enhancedImage, from: enhancedImage.extent) {
                              imageToProcess = resultRef
                          }
                      }
                  } else {
                      let context = CIContext()
                      if let resultRef = context.createCGImage(outputImage, from: outputImage.extent) {
                          imageToProcess = resultRef
                      }
                  }
              }
          }
      }

      // 2. OCR via Vision (using the potentially cropped/enhanced image)
      let request = VNRecognizeTextRequest()
      request.recognitionLevel = .accurate
      request.usesLanguageCorrection = true
      
      let handler = VNImageRequestHandler(cgImage: imageToProcess, options: [:])
      
      do {
        try handler.perform([request])
        guard let observations = request.results else {
          promise.reject("ERR_OCR_FAILED", "No text recognized")
          return
        }
        
        // Preserve some structural clues by joining with newlines
        let recognizedText = observations
            .compactMap { $0.topCandidates(1).first?.string }
            .joined(separator: "\n")
        
        if recognizedText.isEmpty {
           promise.reject("ERR_NO_TEXT", "No text found in image")
           return
        }

        // 3. LLM via LanguageModelSession
        if #available(iOS 26.0, *) {
            Task {
                do {
                    let session = LanguageModelSession()
                    let prompt = """
                    Extract data from this receipt into JSON.
                    
                    Structure:
                    - "detectedStore": Name of the store (from header/logo).
                    - "items": Array of purchased items.
                    
                    Item Rules:
                    - "name": Clean item description (fix OCR errors, e.g. "M1lk" -> "Milk").
                    - "price": Number only.
                    - Exclude: Subtotals, tax, total due, change, card info, dates.
                    - If "2 @ 3.00", price is 6.00.
                    
                    JSON Format (Strict):
                    {
                      "detectedStore": "Store Name",
                      "items": [
                        { "name": "Item Name", "price": 0.00 }
                      ]
                    }
                    
                    Receipt Text:
                    \(recognizedText)
                    """
                    
                    let response = try await session.respond(to: prompt)
                    
                    let responseText = String(response.content)
                    
                    // Clean up markdown if present
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
