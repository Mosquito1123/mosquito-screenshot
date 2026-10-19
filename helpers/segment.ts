/**
 * 长图滚动切片规划。纯计算，供组件层编排；原生只负责单屏截图和拼接。
 */

export interface MqScrollSegment {
  /** 滚动到的 scrollTop。 */
  scrollTop: number
  /** 这一屏从截图顶部裁掉的像素（重叠区）。 */
  cropTop: number
  /** 这一屏实际拼进长图的高度。 */
  keepHeight: number
}

export interface MqPlanScrollOptions {
  /** 可滚动内容总高度。 */
  contentHeight: number
  /** 视口高度。 */
  viewportHeight: number
  /** 相邻两屏重叠像素，减轻接缝。默认 0。 */
  overlap?: number
  /** 长图最大高度，超过则截断。默认 20000。 */
  maxHeight?: number
}

export interface MqPlanScrollResult {
  segments: MqScrollSegment[]
  /** 最终长图高度（可能被 maxHeight 截断）。 */
  totalHeight: number
  truncated: boolean
}

export function planScrollSegments(options: MqPlanScrollOptions): MqPlanScrollResult {
  const content = finitePositive(options.contentHeight, 0)
  const viewport = finitePositive(options.viewportHeight, 0)
  const overlap = Math.max(0, finitePositive(options.overlap ?? 0, 0))
  const maxHeight = Math.max(1, finitePositive(options.maxHeight ?? 20_000, 20_000))

  if (content <= 0 || viewport <= 0) {
    return { segments: [], totalHeight: 0, truncated: false }
  }

  const targetHeight = Math.min(content, maxHeight)
  if (targetHeight <= viewport) {
    return {
      segments: [
        {
          scrollTop: 0,
          cropTop: 0,
          keepHeight: targetHeight,
        },
      ],
      totalHeight: targetHeight,
      truncated: content > maxHeight,
    }
  }

  const step = Math.max(1, viewport - overlap)
  const segments: MqScrollSegment[] = []
  let covered = 0
  let index = 0

  while (covered < targetHeight) {
    const scrollTop = Math.min(index * step, Math.max(0, content - viewport))
    const remaining = targetHeight - covered
    const cropTop = index === 0 ? 0 : Math.min(overlap, Math.max(0, viewport - 1))
    const keepHeight = Math.min(viewport - cropTop, remaining)

    segments.push({
      scrollTop,
      cropTop,
      keepHeight,
    })

    covered += keepHeight
    index += 1

    if (index > 500) {
      break
    }
    if (scrollTop >= content - viewport) {
      if (covered < targetHeight && segments.length > 0) {
        segments[segments.length - 1].keepHeight += targetHeight - covered
        covered = targetHeight
      }
      break
    }
  }

  const totalHeight = segments.reduce((sum, item) => sum + item.keepHeight, 0)
  return {
    segments,
    totalHeight,
    truncated: content > maxHeight,
  }
}

function finitePositive(value: number, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    return fallback
  }
  return value
}
