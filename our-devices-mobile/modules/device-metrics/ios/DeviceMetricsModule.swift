import AVFoundation
import ExpoModulesCore
import NetworkExtension

public class DeviceMetricsModule: Module {
  public func definition() -> ModuleDefinition {
    Name("DeviceMetrics")

    AsyncFunction("getDeviceMetricsAsync") { (includeWifiSsid: Bool) async -> [String: Any] in
      let volume = AVAudioSession.sharedInstance().outputVolume
      var metrics: [String: Any] = [
        "wifiSsid": NSNull(),
        "audioVolumePercent": Int((volume * 100).rounded()),
        "audioMuted": volume == 0
      ]

      if includeWifiSsid, #available(iOS 14.0, *) {
        let ssid = await withCheckedContinuation {
          (continuation: CheckedContinuation<String?, Never>) in
          NEHotspotNetwork.fetchCurrent { network in
            continuation.resume(returning: network?.ssid)
          }
        }
        if let ssid {
          metrics["wifiSsid"] = ssid
        }
      }

      return metrics
    }
  }
}
