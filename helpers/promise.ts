/**
 * 把 UTS 回调式 API 包成 Promise，供 Vue 组件使用。
 * 实际运行时由 uni_modules 注入 captureScreen / stitchImages。
 */

export interface MqCaptureResultLike {
  path: string
  width: number
  height: number
}

export interface MqCaptureFailLike {
  errCode?: number
  errMsg?: string
}

export type CaptureScreenFn = (options: {
  format?: 'png' | 'jpg'
  quality?: number
  success?: (res: MqCaptureResultLike) => void
  fail?: (err: MqCaptureFailLike) => void
  complete?: (res: unknown) => void
}) => void

export type StitchImagesFn = (options: {
  paths: string[]
  format?: 'png' | 'jpg'
  quality?: number
  sliceHeights?: number[]
  sliceOffsets?: number[]
  success?: (res: MqCaptureResultLike) => void
  fail?: (err: MqCaptureFailLike) => void
  complete?: (res: unknown) => void
}) => void

export function captureScreenAsync(
  captureScreen: CaptureScreenFn,
  options: { format?: 'png' | 'jpg'; quality?: number } = {},
): Promise<MqCaptureResultLike> {
  return new Promise((resolve, reject) => {
    captureScreen({
      format: options.format,
      quality: options.quality,
      success: resolve,
      fail: (err) => reject(err ?? { errCode: 9011003, errMsg: '截屏失败' }),
    })
  })
}

export function stitchImagesAsync(
  stitchImages: StitchImagesFn,
  options: {
    paths: string[]
    format?: 'png' | 'jpg'
    quality?: number
    sliceHeights?: number[]
    sliceOffsets?: number[]
  },
): Promise<MqCaptureResultLike> {
  return new Promise((resolve, reject) => {
    stitchImages({
      paths: options.paths,
      format: options.format,
      quality: options.quality,
      sliceHeights: options.sliceHeights,
      sliceOffsets: options.sliceOffsets,
      success: resolve,
      fail: (err) => reject(err ?? { errCode: 9011004, errMsg: '拼接失败' }),
    })
  })
}

export function wait(ms: number): Promise<void> {
  const delay = Math.max(0, ms)
  return new Promise((resolve) => {
    const timer = (globalThis as { setTimeout?: (fn: () => void, ms: number) => unknown }).setTimeout
    if (typeof timer === 'function') {
      timer(() => resolve(), delay)
      return
    }
    resolve()
  })
}
