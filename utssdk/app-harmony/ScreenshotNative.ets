/**
 * HarmonyOS 窗口截屏与纵向拼接（ArkTS 混编）。
 * 由 index.uts 调用；语法以 Harmony API 12+ / HBuilderX 4.61+ 为准。
 */
import { image } from '@kit.ImageKit'
import { fileIo } from '@kit.CoreFileKit'
import { BusinessError } from '@kit.BasicServicesKit'
import { common } from '@kit.AbilityKit'
import { window } from '@kit.ArkUI'

export type NativeCaptureResult = {
  path: string
  width: number
  height: number
}

function resolveMime(format: string): string {
  return format === 'jpg' ? 'image/jpeg' : 'image/png'
}

function resolveExt(format: string): string {
  return format === 'jpg' ? 'jpg' : 'png'
}

function resolveQuality(quality: number): number {
  if (quality < 1) {
    return 90
  }
  if (quality > 100) {
    return 100
  }
  return quality
}

function cachePath(context: common.UIAbilityContext, format: string): string {
  const name = `mq_shot_${Date.now()}_${Math.floor(Math.random() * 10000)}.${resolveExt(format)}`
  return `${context.cacheDir}/${name}`
}

async function packPixelMapToFile(
  pixelMap: image.PixelMap,
  outPath: string,
  format: string,
  quality: number
): Promise<NativeCaptureResult> {
  const info = pixelMap.getImageInfoSync()
  const packer = image.createImagePacker()
  const file = fileIo.openSync(outPath, fileIo.OpenMode.CREATE | fileIo.OpenMode.READ_WRITE | fileIo.OpenMode.TRUNC)
  try {
    await packer.packToFile(pixelMap, file.fd, {
      format: resolveMime(format),
      quality: format === 'jpg' ? resolveQuality(quality) : 100
    })
  } finally {
    fileIo.closeSync(file)
    packer.release()
  }
  return {
    path: outPath,
    width: info.size.width,
    height: info.size.height
  }
}

export class ScreenshotNative {
  /**
   * 截取当前窗口。window 由 UTS 侧 UTSHarmony.getCurrentWindow() 传入。
   */
  static async captureWindow(
    win: window.Window,
    context: common.UIAbilityContext,
    format: string,
    quality: number
  ): Promise<NativeCaptureResult> {
    const pixelMap = await win.snapshot()
    try {
      const outPath = cachePath(context, format)
      return await packPixelMapToFile(pixelMap, outPath, format, quality)
    } finally {
      pixelMap.release()
    }
  }

  /**
   * 按 paths 顺序纵向拼接；sliceOffsets / sliceHeights 与 Android 语义一致。
   */
  static async stitchImages(
    context: common.UIAbilityContext,
    paths: string[],
    format: string,
    quality: number,
    sliceHeights: number[] | null,
    sliceOffsets: number[] | null
  ): Promise<NativeCaptureResult> {
    if (paths.length === 0) {
      throw { code: 9011002, message: 'paths empty' } as BusinessError
    }

    const slices: image.PixelMap[] = []
    let outWidth = 0
    let totalHeight = 0

    try {
      for (let i = 0; i < paths.length; i++) {
        const source = image.createImageSource(paths[i])
        const bmp = await source.createPixelMap()
        source.release()
        const info = bmp.getImageInfoSync()
        const cropTop = sliceOffsets != null && sliceOffsets.length > i
          ? Math.max(0, Math.floor(sliceOffsets[i]))
          : 0
        let keep = sliceHeights != null && sliceHeights.length > i
          ? Math.max(1, Math.floor(sliceHeights[i]))
          : info.size.height - cropTop
        if (cropTop + keep > info.size.height) {
          keep = info.size.height - cropTop
        }
        if (keep <= 0) {
          bmp.release()
          throw { code: 9011004, message: 'invalid slice height' } as BusinessError
        }
        if (cropTop > 0 || keep < info.size.height) {
          await bmp.crop({
            x: 0,
            y: cropTop,
            size: {
              width: info.size.width,
              height: keep
            }
          })
        }
        const sliceInfo = bmp.getImageInfoSync()
        slices.push(bmp)
        outWidth = Math.max(outWidth, sliceInfo.size.width)
        totalHeight += sliceInfo.size.height
      }

      if (outWidth <= 0 || totalHeight <= 0) {
        throw { code: 9011004, message: 'empty canvas' } as BusinessError
      }

      const out = image.createPixelMapSync({
        editable: true,
        pixelFormat: image.PixelMapFormat.BGRA_8888,
        size: {
          width: outWidth,
          height: totalHeight
        }
      })

      let y = 0
      for (let i = 0; i < slices.length; i++) {
        const slice = slices[i]
        const sliceInfo = slice.getImageInfoSync()
        const stride = slice.getBytesNumberPerRow()
        const bytes = slice.getPixelBytesNumber()
        const buffer = new ArrayBuffer(bytes)
        const area: image.PositionArea = {
          pixels: buffer,
          offset: 0,
          stride: stride,
          region: {
            x: 0,
            y: 0,
            size: {
              width: sliceInfo.size.width,
              height: sliceInfo.size.height
            }
          }
        }
        slice.readPixelsSync(area)
        const writeArea: image.PositionArea = {
          pixels: buffer,
          offset: 0,
          stride: stride,
          region: {
            x: 0,
            y: y,
            size: {
              width: sliceInfo.size.width,
              height: sliceInfo.size.height
            }
          }
        }
        out.writePixelsSync(writeArea)
        y += sliceInfo.size.height
      }

      try {
        const outPath = cachePath(context, format)
        return await packPixelMapToFile(out, outPath, format, quality)
      } finally {
        out.release()
      }
    } finally {
      for (let i = 0; i < slices.length; i++) {
        slices[i].release()
      }
    }
  }
}
