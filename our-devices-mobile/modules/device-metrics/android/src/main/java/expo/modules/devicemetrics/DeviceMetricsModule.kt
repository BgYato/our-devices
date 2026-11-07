package expo.modules.devicemetrics

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.media.AudioManager
import android.net.wifi.WifiManager
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlin.math.roundToInt

class DeviceMetricsModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("DeviceMetrics")

    AsyncFunction("getDeviceMetricsAsync") { includeWifiSsid: Boolean ->
      val context = appContext.reactContext
        ?: throw IllegalStateException("Android context is unavailable.")
      val audioManager =
        context.getSystemService(Context.AUDIO_SERVICE) as AudioManager
      val maxVolume = audioManager.getStreamMaxVolume(AudioManager.STREAM_MUSIC)
      val volume = audioManager.getStreamVolume(AudioManager.STREAM_MUSIC)
      val wifiSsid = if (includeWifiSsid) readWifiSsid(context) else null

      mapOf(
        "wifiSsid" to wifiSsid,
        "audioVolumePercent" to if (maxVolume > 0) {
          (volume * 100.0 / maxVolume).roundToInt()
        } else {
          null
        },
        "audioMuted" to audioManager.isStreamMute(AudioManager.STREAM_MUSIC),
      )
    }
  }

  @Suppress("DEPRECATION")
  private fun readWifiSsid(context: Context): String? {
    if (
      context.checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) !=
      PackageManager.PERMISSION_GRANTED
    ) {
      return null
    }
    val wifiManager =
      context.applicationContext.getSystemService(Context.WIFI_SERVICE) as? WifiManager
        ?: return null
    val ssid = wifiManager.connectionInfo?.ssid?.trim('"')?.trim()
    return ssid?.takeIf { it.isNotEmpty() && it != "<unknown ssid>" }
  }
}
