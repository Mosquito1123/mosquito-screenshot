<template>
  <view class="mq-screenshot">
    <slot />
  </view>
</template>

<script setup lang="ts">
/**
 * 截屏 / 截长图组件。
 * 依赖同插件 UTS API：`captureScreen`、`stitchImages`。
 * 请将整个包复制为工程内 `uni_modules/mosquito-screenshot`。
 */
import { getCurrentInstance } from 'vue'
import { planScrollSegments } from '../../helpers/segment'
import { captureScreenAsync, stitchImagesAsync, wait } from '../../helpers/promise'
// @ts-expect-error uni_modules 在业务工程中由 uni-app 解析
import { captureScreen, stitchImages } from '@/uni_modules/mosquito-screenshot'

defineOptions({
  name: 'mq-screenshot',
})

const props = withDefaults(
  defineProps<{
    format?: 'png' | 'jpg'
    quality?: number
    overlap?: number
    settleDelay?: number
    maxHeight?: number
    /** 可选。传入则跳过测量，直接按该内容高度规划长图。 */
    contentHeight?: number
  }>(),
  {
    format: 'png',
    quality: 90,
    overlap: 0,
    settleDelay: 280,
    maxHeight: 20_000,
    contentHeight: 0,
  },
)

const emit = defineEmits<{
  progress: [payload: { current: number; total: number }]
  success: [payload: { path: string; width: number; height: number }]
  fail: [payload: { errCode?: number; errMsg?: string }]
}>()

const instance = getCurrentInstance()

function pageScrollTo(scrollTop: number): Promise<void> {
  return new Promise((resolve) => {
    uni.pageScrollTo({
      scrollTop,
      duration: 0,
      complete: () => resolve(),
    })
  })
}

function measurePage(): Promise<{ contentHeight: number; viewportHeight: number }> {
  return new Promise((resolve) => {
    uni.getSystemInfo({
      success: (sys) => {
        const viewportHeight = sys.windowHeight || sys.screenHeight || 0
        if (props.contentHeight > 0) {
          resolve({ contentHeight: props.contentHeight, viewportHeight })
          return
        }
        const query = uni.createSelectorQuery()
        if (instance?.proxy) {
          query.in(instance.proxy as never)
        }
        query
          .selectViewport()
          .scrollOffset((scroll) => {
            const offset = scroll as { scrollHeight?: number }
            resolve({
              contentHeight: offset?.scrollHeight || viewportHeight,
              viewportHeight,
            })
          })
          .exec()
      },
      fail: () => resolve({ contentHeight: 0, viewportHeight: 0 }),
    })
  })
}

async function capture() {
  try {
    const result = await captureScreenAsync(captureScreen, {
      format: props.format,
      quality: props.quality,
    })
    emit('success', result)
    return result
  } catch (err) {
    emit('fail', err as { errCode?: number; errMsg?: string })
    throw err
  }
}

async function captureLong() {
  const { contentHeight, viewportHeight } = await measurePage()
  const plan = planScrollSegments({
    contentHeight,
    viewportHeight,
    overlap: props.overlap,
    maxHeight: props.maxHeight,
  })

  if (plan.segments.length === 0) {
    const err = { errCode: 9011002, errMsg: '无法测量页面高度' }
    emit('fail', err)
    throw err
  }

  const paths: string[] = []
  const sliceHeights: number[] = []
  const sliceOffsets: number[] = []

  try {
    for (let i = 0; i < plan.segments.length; i++) {
      const segment = plan.segments[i]
      emit('progress', { current: i + 1, total: plan.segments.length })
      await pageScrollTo(segment.scrollTop)
      await wait(props.settleDelay)
      const shot = await captureScreenAsync(captureScreen, {
        format: props.format,
        quality: props.quality,
      })
      paths.push(shot.path)
      sliceHeights.push(segment.keepHeight)
      sliceOffsets.push(segment.cropTop)
    }

    const result = await stitchImagesAsync(stitchImages, {
      paths,
      format: props.format,
      quality: props.quality,
      sliceHeights,
      sliceOffsets,
    })

    await pageScrollTo(0)
    emit('success', result)
    return result
  } catch (err) {
    try {
      await pageScrollTo(0)
    } catch {
      // ignore
    }
    emit('fail', err as { errCode?: number; errMsg?: string })
    throw err
  }
}

defineExpose({
  capture,
  captureLong,
})
</script>

<style>
.mq-screenshot {
  display: block;
}
</style>
