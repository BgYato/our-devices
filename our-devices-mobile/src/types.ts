export type User = {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
};

export type Telemetry = {
  batteryLevel: number | null;
  cpuUsagePercent: number | null;
  memoryUsagePercent: number | null;
  freeStorageMB: number | null;
  totalStorageMB: number | null;
  totalMemoryMB: number | null;
  networkType: string | null;
  wifiSsid: string | null;
  audioVolumePercent: number | null;
  audioMuted: boolean | null;
  wifiSsidSharingEnabled: boolean | null;
  latitude: number | null;
  longitude: number | null;
  locationAccuracyMeters: number | null;
  locationCapturedAt: string | null;
  locationSharingEnabled: boolean | null;
  capturedAt?: string | null;
};

export type DeviceRecord = {
  id: string;
  deviceTypeName?: string | null;
  name?: string | null;
  customName?: string | null;
  hostname?: string | null;
  osName?: string | null;
  osVersion?: string | null;
  batteryLevel?: number | null;
  isOnline?: boolean | null;
  status?: string | null;
  lastSeen?: string | null;
  telemetry?: Telemetry | null;
};

export type DeviceLocation = {
  device: DeviceRecord;
  latitude: number;
  longitude: number;
  accuracyMeters: number | null;
};
