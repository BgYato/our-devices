Pod::Spec.new do |s|
  s.name           = 'DeviceMetrics'
  s.version        = '1.0.0'
  s.summary        = 'Native device network and audio metrics for OurDevices.'
  s.description    = 'Reads the active Wi-Fi network name and output volume.'
  s.author         = 'OurDevices'
  s.homepage       = 'https://github.com/BgYato/our-devices'
  s.license        = { :type => 'MIT' }
  s.platforms      = { :ios => '15.1' }
  s.source         = { :git => 'https://github.com/BgYato/our-devices.git', :tag => s.version.to_s }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.source_files = '**/*.{h,m,mm,swift}'
end
