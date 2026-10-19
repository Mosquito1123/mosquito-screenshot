/**
 * @mosquito/uts-screenshot 类型声明（供业务工程 TypeScript / HBuilderX 提示）
 */

export type MqCaptureFormat = 'png' | 'jpg'

export type MqCaptureResult = {
  path: string
  width: number
  height: number
}

export type MqCaptureErrorCode =
  | 9011001
  | 9011002
  | 9011003
  | 9011004
  | 9011005
  | 9011006

export interface MqCaptureFail {
  errCode: MqCaptureErrorCode
  errSubject?: string
  errMsg?: string
}

export type MqCaptureScreenOptions = {
  format?: MqCaptureFormat
  quality?: number
  success?: (res: MqCaptureResult) => void
  fail?: (res: MqCaptureFail) => void
  complete?: (res: any) => void
}

export type MqStitchImagesOptions = {
  paths: string[]
  format?: MqCaptureFormat
  quality?: number
  sliceHeights?: number[]
  sliceOffsets?: number[]
  success?: (res: MqCaptureResult) => void
  fail?: (res: MqCaptureFail) => void
  complete?: (res: any) => void
}

export declare function captureScreen(options: MqCaptureScreenOptions): void
export declare function stitchImages(options: MqStitchImagesOptions): void
