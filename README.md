# 小白算命

八字算命 + 周易铜钱起卦的离线 PWA，纯前端实现，内容仅供娱乐参考。

## 功能

- **算命**：输入公历生日 + 时辰，本地自动排盘（四柱干支、五行分布、十神、日主强弱），按「事业 / 财运 / 情感 / 姻缘 / 健康 / 学业 / 综合运势」七类给出解读与警示。
- **抽签**：每日仅可求一签（每天 0 点重置）。选一个类别，三枚铜钱摇六次成卦，得出本卦与变卦，附卦辞、爻辞、白话解读与分类引申。

## 技术

- 纯静态：HTML / CSS / 原生 JS，无构建、无后端。
- 数据本地存储（localStorage），离线可用（Service Worker）。
- 可部署到 GitHub Pages。

## 目录

```
index.html            主页面
styles.css            样式
manifest.webmanifest  PWA 清单
sw.js                 Service Worker
icons/icon.svg        图标
js/yijing.js          周易核心引擎（八卦、起卦、变卦）
js/bazi.js            八字排盘（节气 / 干支 / 五行 / 十神）
js/interpret.js       解读引擎
js/app.js             界面控制器
js/data/hex-*.js      六十四卦数据（卦辞 / 爻辞 / 白话 / 分类引申）
```

## 免责声明

本应用所有命理与卦象内容仅供参考与娱乐，请理性看待，切勿迷信。重大决策请依据事实与理性判断。
