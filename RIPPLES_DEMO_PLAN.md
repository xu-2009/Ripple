# Ripples — Demo 工作文档

**项目**：2026 Congressional App Challenge 候选项目  
**标语**：Small changes. Bigger impact.  
**状态**：独立新项目；NewRoots 文件保持原样。

## 核心体验

一个 Utah 家庭填写每月水、电账单，看懂自己的用量和变化，获得有依据的比较与节约建议。个人的行动以涟漪呈现；社区层面的图表在取得真实、可安全汇总的数据之前必须标为演示。

用户路径：**Track → Compare → Learn → Conserve → Make an Impact**。

## 首个可运行版本

1. **Profile**：人数、住宅类型、城市/ZIP、草坪、灌溉是否包含在水费中；都可以修改。
2. **My Usage**：新增、修改、删除水电账单；支持历史账单。保存原始单位和标准单位，阻止同一类型与账期的无意重复。
3. **Home**：最近账单、按天归一的环比、每人每天用水、历史折线图。只有一张账单时也能显示有用信息。
4. **You vs. Utah**：先对电量提供注明来源、年份和口径的比较。水量在找到同口径的住宅基准前，不显示虚构的州平均值。
5. **Make a Ripple**：先做淋浴时长模拟器，所有结果明确标为估算。
6. **Explore Utah**：可交互的地区入口；没有真实跨用户汇总前，地图明确标注演示状态，不展示家庭级数据。

网站采用手机优先设计，桌面也可使用。视觉风格依照 partner 的规格：深海蓝、青绿、浅水色、浅色卡片，Plus Jakarta Sans 和 Outfit 字体，低幅度涟漪动画及 reduced-motion 支持。

## 关键计算

- 用水标准单位：gallons。录入时可选择 gallons、kgal 或 CCF；1 kgal = 1,000 gallons，1 CCF ≈ 748.052 gallons。
- 人均日用水：`gallons ÷ (家庭人数 × 账单天数)`。
- 用电标准单位：kWh。
- 环比：比较两个账期的**日均**用量，避免账单天数不同造成误差。
- 电量和州均比较：把当前账期的 kWh 归一为约一个月，再与 EIA 的 2024 Utah 居民账户月均 774 kWh 对比；明确说明该基准没有按家庭人数、住宅类型或季节调整。
- 模拟节水：`max(当前淋浴分钟－目标分钟, 0) × 花洒流量(gpm) × 每天淋浴次数`；仅是估算，绝不算入实测节约量。

## 数据来源与限制

- 电量基准：[U.S. Energy Information Administration, 2024 Average Monthly Bill — Residential, Table 5A](https://www.eia.gov/electricity/sales_revenue_price/pdf/table_5A.pdf)，Utah 居民账户月均 **774 kWh**。
- [Utah Division of Water Resources 的用水报告方法说明](https://water.utah.gov/water-data/water-use-reporting/)指出，该州常见 GPCD 指标把多种用户和水源纳入计算，不能直接当作单户水费的同口径住宅平均值。
- 初期仅用浏览器本地存储。没有登录、云端数据库或跨家庭社区汇总。真实地图聚合必须等后台与隐私门槛实现。

## 开发顺序

1. 家庭资料和账单录入。
2. 本地持久保存、编辑删除、输入校验与趋势图。
3. 有来源的电量比较和水量口径说明。
4. 节水模拟器、建议和地图交互。
5. 最后做水面效果、设备倾斜和其他动画。

每一阶段先保证真实操作和计算正确，再增加视觉细节。所有 AI 实现步骤记录在本目录，供学生团队审阅与修改。

## 2026-10-18 验收更新

本轮 32 组浏览器检查通过，详情见 [P0_ACCEPTANCE.md](P0_ACCEPTANCE.md)。完整 P0 仍缺住宅口径的水量基准对比。月目标与电量基准均按 `账单用量 / 账单天数 × 30.44` 换算，页面明确说明。
