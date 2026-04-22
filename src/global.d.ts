declare global {
  interface MediaTrackSettings {
    exposureTime?: number;
    exposureCompensation?: number;
    exposureMode?: string;
  }

  interface MediaTrackCapabilities {
    exposureTime?: {
      min?: number;
      max?: number;
      step?: number;
    };
    exposureCompensation?: {
      min?: number;
      max?: number;
      step?: number;
    };
    exposureMode?: string[];
  }
}

export {};
