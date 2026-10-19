# @mosquito/uts-screenshot

UTS 截屏 / 截长图插件，兼容 **uni-app（Vue 3）** 与 **uni-app x**。

- App Android / iOS / HarmonyOS：原生截当前窗口，并把多张切片拼成长图
- 组件 `mq-screenshot`：编排「滚动 → 截屏 → 拼接」
- H5 / 小程序：明确返回不支持（浏览器与小程序没有稳定的整窗截屏能力）

本仓是从 `@mosquito/ui` 拆出的独立 UTS 插件。UI 库不携带原生能力；截屏必须进原生，对应 mosquito-ui 文档 [UNIAPPX.md](https://github.com/Mosquito1123/mosquito-ui/blob/main/docs/UNIAPPX.md) 里「UTS 只用于原生插件」的约定。

## 安装

把本目录复制到业务工程：

```text
your-app/uni_modules/mosquito-screenshot/
```

目录名必须是 `mosquito-screenshot`，这样下面的导入路径才能解析：

```ts
import { captureScreen, stitchImages } from '@/uni_modules/mosquito-screenshot'
```

本仓也可直接跑：

```bash
pnpm test
pnpm typecheck
```

## 能力

| API | 说明 |
| --- | --- |
| `captureScreen` | 截取当前窗口（单屏） |
| `stitchImages` | 按顺序纵向拼接多张临时图，可裁重叠区 |
| `<mq-screenshot />` | 组件。`capture()` 单屏；`captureLong()` 滚动截长图 |

### 长图怎么做

长图不在原生里盲滚，而是：

1. 组件测量页面高度，规划每一屏的 `scrollTop` / 裁剪高度（见 `helpers/segment.ts`）
2. `uni.pageScrollTo` 滚到位置并短暂等待
3. 调用 `captureScreen` 得到切片路径
4. 调用 `stitchImages` 拼成一张长图

这样 uni-app 与 uni-app x 都能复用同一套原生截屏，滚动交给前端。

## 用法

### 命令式

```ts
import { captureScreen, stitchImages } from '@/uni_modules/mosquito-screenshot'

captureScreen({
  format: 'png',
  success(res) {
    console.log(res.path, res.width, res.height)
  },
  fail(err) {
    console.error(err.errCode, err.errMsg)
  },
})
```

### 组件

```vue
<script setup lang="ts">
import { ref } from 'vue'

const shot = ref<{ capture: () => Promise<unknown>; captureLong: () => Promise<unknown> } | null>(null)

async function onShot() {
  await shot.value?.capture()
}

async function onLong() {
  await shot.value?.captureLong()
}
</script>

<template>
  <mq-screenshot ref="shot" :overlap="80" :max-height="20000" @progress="console.log" @success="console.log">
    <!-- 页面内容；长图依赖页面级滚动 -->
  </mq-screenshot>
  <button @click="onShot">截屏</button>
  <button @click="onLong">截长图</button>
</template>
```

easycom 示例：

```json
{
  "easycom": {
    "custom": {
      "^mq-screenshot$": "@/uni_modules/mosquito-screenshot/components/mq-screenshot/mq-screenshot.vue"
    }
  }
}
```

uni-app x 把扩展名改成 `.uvue`。x 端截长图请传入 `content-height`（可滚动内容高度，单位 px）。

## 错误码

| 码 | 含义 |
| --- | --- |
| 9011001 | 当前平台不支持 |
| 9011002 | 参数非法 |
| 9011003 | 截屏失败 |
| 9011004 | 拼接失败 |
| 9011005 | 文件读写失败 |
| 9011006 | 超出最大高度 |

## 平台说明

| 平台 | 单屏 | 长图 |
| --- | --- | --- |
| App Android | PixelCopy（API 26+），低版本 View.draw | 组件滚动 + `stitchImages` |
| App iOS | 关键窗口快照 | 同上 |
| App HarmonyOS | `Window.snapshot` → PixelMap（API 12+，HBuilderX 4.61+） | 同上 |
| H5 | 不支持（9011001） | 不支持 |
| 微信小程序 | 不支持（9011001） | 不支持 |

## 注意

- 截图写在应用缓存目录，不会上传、不采集用户数据；**不申请**相册/存储等敏感权限。
- 长图有 `maxHeight`（默认 20000px），避免内存暴涨。
- 局部 `scroll-view` 的长图：请自行滚动该区域，循环调用 `captureScreen`，再 `stitchImages`；组件默认编排的是**页面级**滚动。
- UTS 源码需在 HBuilderX 或 uni-app App 自定义基座里编译；鸿蒙需 **HBuilderX 4.61+**。本仓库 CI 只跑 `helpers` 纯计算测试，不编译原生。
- 目录与原生配置遵循 [UTS 插件规范](https://uniapp.dcloud.net.cn/plugin/uts-plugin.html)。

## 目录

```text
mosquito-screenshot/
  package.json
  index.d.ts
  changelog.md
  utssdk/
    interface.uts
    unierror.uts
    app-android/
      index.uts
      config.json
      AndroidManifest.xml
    app-ios/
      index.uts
      config.json
    app-harmony/
      index.uts
      ScreenshotNative.ets
      config.json
      module.json5
    web/index.uts
    mp-weixin/index.uts
  components/mq-screenshot/
    mq-screenshot.vue
    mq-screenshot.uvue
  helpers/
```
