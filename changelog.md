## 0.1.2（2026-10-19）

- 按 [UTS 插件规范](https://uniapp.dcloud.net.cn/plugin/uts-plugin.html) 补齐各端原生配置：
  - `app-android/config.json`、`AndroidManifest.xml`（无额外敏感权限）
  - `app-ios/config.json`
  - `app-harmony/config.json`、`module.json5`
- 补充 `index.d.ts` 类型声明与 `changelog.md`
- 修正插件市场权限说明：本应用窗口截图 + 写缓存，无需系统敏感权限

## 0.1.1（2026-10-19）

- 新增 App HarmonyOS：`Window.snapshot` + PixelMap 拼接（HBuilderX 4.61+ / API 12+）
- `package.json` 平台表标记 `app-harmony` 可用

## 0.1.0（2026-10-19）

- 从 `@mosquito/ui` 拆出独立 UTS 插件
- App Android / iOS 截屏与拼接；`mq-screenshot` 长图编排
- H5 / 微信小程序明确返回不支持（9011001）
