# 截屏 / 截长图

本仓库即 UTS 插件本体，发布形态为 `uni_modules/mosquito-screenshot`。

## 为什么单独成仓

- 整窗截图依赖 Android `PixelCopy` / iOS 窗口快照，必须进原生
- UI 组件库 `@mosquito/ui` 保持可在无原生工具链下做 typecheck / 单测
- uni-app 与 uni-app x 共用同一套 `uni_modules` 插件目录

## 接入

1. 复制本仓库 → 业务工程 `uni_modules/mosquito-screenshot`
2. App 端使用自定义基座或云打包编译 UTS
3. 调用 `captureScreen` / `stitchImages`，或使用 `<mq-screenshot />`

细节、错误码和平台表见根目录 [README](../README.md)。
