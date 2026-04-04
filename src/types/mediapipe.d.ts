declare module '@mediapipe/tasks-vision' {
  export class PoseLandmarker {
    static createFromOptions(
      wasmFileset: any,
      options: any
    ): Promise<PoseLandmarker>
    static POSE_CONNECTIONS: any
    detectForVideo(video: HTMLVideoElement, timestamp: number): any
  }

  export class FaceLandmarker {
    static createFromOptions(
      wasmFileset: any,
      options: any
    ): Promise<FaceLandmarker>
    detectForVideo(video: HTMLVideoElement, timestamp: number): any
  }

  export class ImageSegmenter {
    static createFromOptions(
      wasmFileset: any,
      options: any
    ): Promise<ImageSegmenter>
    segmentForVideo(video: HTMLVideoElement, timestamp: number): any
  }

  export class FilesetResolver {
    static forVisionTasks(path: string): Promise<any>
  }

  export class DrawingUtils {
    constructor(ctx: CanvasRenderingContext2D)
    drawConnectors(landmarks: any[], connections: any, options?: any): void
    drawLandmarks(landmarks: any[], options?: any): void
  }
}
