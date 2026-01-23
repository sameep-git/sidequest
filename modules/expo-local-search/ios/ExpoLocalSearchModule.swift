import ExpoModulesCore
import MapKit

public class ExpoLocalSearchModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoLocalSearch")

    AsyncFunction("search") { (query: String, latitude: Double, longitude: Double, radiusMeters: Double) -> [[String: Any]] in
      let request = MKLocalSearch.Request()
      request.naturalLanguageQuery = query
      
      let center = CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
      // Convert radius in meters to a rough coordinate span (very approx: 111km per degree)
      // Better to use MKCoordinateRegion(center:latitudinalMeters:longitudinalMeters:)
      let region = MKCoordinateRegion(center: center, latitudinalMeters: radiusMeters, longitudinalMeters: radiusMeters)
      request.region = region

      let search = MKLocalSearch(request: request)
      
      return try await withCheckedThrowingContinuation { continuation in
        search.start { response, error in
          if let error = error {
            continuation.resume(throwing: error)
            return
          }
          
          guard let response = response else {
            continuation.resume(returning: [])
            return
          }
          
          let results = response.mapItems.map { item -> [String: Any] in
            return [
              "name": item.name ?? "Unknown",
              "latitude": item.placemark.coordinate.latitude,
              "longitude": item.placemark.coordinate.longitude,
              "address": item.placemark.title ?? ""
            ]
          }
          
          continuation.resume(returning: results)
        }
      }
    }
  }
}
