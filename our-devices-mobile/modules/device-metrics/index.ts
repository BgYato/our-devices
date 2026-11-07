import { requireOptionalNativeModule } from "expo-modules-core";

type DeviceMetricsModule = {
  getDeviceMetricsAsync: (includeWifiSsid: boolean) => Promise<{
    wifiSsid: string | null;
    audioVolumePercent: number | null;
    audioMuted: boolean | null;
  }>;
};

const nativeModule =
  requireOptionalNativeModule<DeviceMetricsModule>("DeviceMetrics");

export const isDeviceMetricsAvailable = nativeModule !== null;

export async function getDeviceMetrics(includeWifiSsid: boolean) {
  if (!nativeModule) {
    return {
      wifiSsid: null,
      audioVolumePercent: null,
      audioMuted: null,
    };
  }
  const metrics = await nativeModule.getDeviceMetricsAsync(includeWifiSsid);
  return {
    wifiSsid: metrics.wifiSsid || null,
    audioVolumePercent: metrics.audioVolumePercent,
    audioMuted: metrics.audioMuted,
  };
}
