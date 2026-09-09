# HuggingPath 协作约定

## 项目速览
- Vue 3 + TypeScript + Vite + Tailwind，hash 路由，无后端，数据存 localStorage / sessionStorage。
- 开发端口 3000（`npm run dev`），演示账号 demo / demo123。
- README.md 按日期维护更新说明，重要改动完成后需要补充对应章节。

## 协作偏好
- 页面优化类需求：先主动给出设计建议、指出问题和可选方案，再动手实现；不要只做字面执行。不确定的地方必须明确提出并询问，不要自行猜测。
- 改动完成后运行 `npm run typecheck`、`npm run lint`、`npm run build`，并用浏览器实际操作验证页面效果（含宽屏与窄屏）。
- 用户要求时：更新 README 更新说明，并提交推送到 origin/main。
- 工作区可能有用户未提交的改动：不要回退或清理不属于自己的修改。

## 界面规范
- 按钮层级：查看、返回、关闭、取消使用中性弱按钮；推理与次级执行操作使用系统紫色弱强调。
- 必填字段统一使用红色 `*` 标识。
- 列表勾选为页面级临时状态，离开页面后自动清空，不通过 sessionStorage 跨页恢复。
- 弹窗内完成当前页操作（如 Case 添加 WSI），不跳转到其他页面。
