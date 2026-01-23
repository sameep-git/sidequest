require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'expo-module.config.json')))

Pod::Spec.new do |s|
  s.name           = 'ExpoLocalSearch'
  s.version        = '1.0.0'
  s.summary        = 'Local search module using MapKit'
  s.description    = 'An Expo module for searching nearby places using Apple MapKit'
  s.author         = 'Sameep Shah'
  s.homepage       = 'https://github.com/sameepshah/sidequest'
  s.platforms      = { :ios => '15.1' }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.source_files = '**/*.{h,m,mm,swift,hpp,cpp}'
end
