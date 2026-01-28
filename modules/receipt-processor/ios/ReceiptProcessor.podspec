require 'json'

Pod::Spec.new do |s|
  s.name           = 'ReceiptProcessor'
  s.version        = '1.0.0'
  s.summary        = 'On-device receipt processing'
  s.description    = 'Expo module for scanning receipts using Apple Vision and LanguageModelSession'
  s.author         = 'Sameep Shah'
  s.homepage       = 'https://github.com/sameepshah/sidequest'
  s.platforms      = { :ios => '15.1' }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.source_files = '**/*.{h,m,mm,swift,hpp,cpp}'
end
