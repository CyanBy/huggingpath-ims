# 队列标签清单与质量检查结论（label audit / QC only）

- 生成时间：2026-08-31；分析单位：**患者（case）**；机读明细：[label_audit_qc.json](artifact:label_audit_qc.json)
- 队列基线：cBioPortal `stad_tcga_pan_can_atlas_2018` 原始患者 440 例；GDC 切片库 443 病例 / 1197 张 WSI；当前分析队列（data/cohort_manifest.csv ∩ feature_matrix.csv）**375 例患者，每例 1 张 primary 肿瘤切片（sample code 01；DX1=348、TS1=10、TSA=9、TSB=5、TS2=3）**。
- 数据来源：① cBioPortal PanCancer Atlas 2018 逐患者 clinical-data（labels/raw/*.json，37 个属性）；② GDC 病理 GRADE（labels/raw_grade_gdc.json，443 例）；③ derived_cohort_master.json（病例↔切片映射）；④ data/ 队列包。`labels/raw_subtype.json` 为 **0 字节空文件**，无任何内容。
- 解释边界：SUBTYPE/生存等均为研究衍生层（research-derived），非临床 IHC/ISH/病理报告原件。

## 一、全部输入字段穷举与分类（37 个原始属性 + 派生/映射字段）

分类：L=可比较标签候选，C=混杂变量，ID=标识符，B=批次信息，K=泄漏字段，NA=信息不足暂不可用。覆盖率为当前 375 例队列内有效患者数。

| 原始字段 | 分类 | 有效/375 | 缺失率 | 说明 |
|---|---|---|---|---|
| SUBTYPE | L | 328 | 12.5% | TCGA 分子亚型（CIN/EBV/GS/MSI/POLE），研究衍生 |
| OS_MONTHS / OS_STATUS | L（生存终点） | 369 / 373 | 1.6% / 0.5% | 总生存；STATUS 二值 0:LIVING/1:DECEASED |
| DSS_MONTHS / DSS_STATUS | L（生存终点） | 369 / 360 | 1.6% / 4.0% | 疾病特异生存 |
| PFS_MONTHS / PFS_STATUS | L（生存终点） | 370 / 373 | 1.3% / 0.5% | 无进展生存 |
| DFS_MONTHS / DFS_STATUS | L（生存终点，慎用） | 241 / 242 | 35.7% / 35.5% | 无病生存，缺失超 1/3 |
| AJCC_PATHOLOGIC_TUMOR_STAGE | L（分期分组） | 369 | 1.6% | IA–IV 及亚期；含粗粒度 STAGE I/II/III 各少量 |
| PATH_T_STAGE / PATH_N_STAGE / PATH_M_STAGE | L（分期分组） | 373 / 372 / 373 | ≤0.8% | T2–T4B；N0–N3；M0=338、M1=20、MX=15 |
| PERSON_NEOPLASM_CANCER_STATUS | L（需确认） | 342 | 8.8% | Tumor Free=267 / With Tumor=75 |
| NEW_TUMOR_EVENT_AFTER_INITIAL_TREATMENT | L（需确认） | 333 | 11.2% | No=237 / Yes=96，复发事件代理 |
| AGE | C | 369 | 1.6% | 诊断年龄（另有 DAYS_TO_BIRTH 冗余） |
| SEX | C | 373 | 0.5% | Male=241 / Female=132 |
| RACE / ETHNICITY / GENETIC_ANCESTRY_LABEL | C | 334 / 285 / 337 | 10.9% / 24.0% / 10.1% | 人群结构混杂；三字段部分冗余 |
| ICD_O_3_SITE / ICD_10 | C | 373 | 0.5% | 原发部位（C16.0–C16.9），完全冗余（两字段一致） |
| ICD_O_3_HISTOLOGY | C（或组织学亚型标签，需确认） | 373 | 0.5% | 8140/3=134、8144/3=68、8211/3=66、8145/3=64、8480/3=20 等 |
| HISTORY_NEOADJUVANT_TRTYN | C（常量） | 373 | 0.5% | 全部 No，无区分度 |
| RADIATION_THERAPY | C | 349 | 6.9% | No=282 / Yes=67 |
| PRIOR_DX | C | 373 | 0.5% | No=363 / Yes=10 |
| PRIMARY_LYMPH_NODE_PRESENTATION_ASSESSMENT | C | 365 | 2.7% | Yes=339 / No=26 |
| AJCC_STAGING_EDITION | B | 373 | 0.5% | 7TH=269、6TH=95、5TH=8、4TH=1 —— 分期比较必须按版本校正 |
| CANCER_TYPE_ACRONYM | B（常量） | 373 | 0.5% | 全部 STAD |
| FORM_COMPLETION_DATE | B | 371 | 1.1% | 病例报告表提交日期，潜在批次 |
| IN_PANCANPATHWAYS_FREEZE | B | 373 | 0.5% | Yes=328 / No=45，数据冻结批次 |
| SAMPLE_COUNT | B（常量） | 373 | 0.5% | 全部 1 |
| DAYS_TO_INITIAL_PATHOLOGIC_DIAGNOSIS | B（常量） | 368 | 1.9% | 全部 0 |
| OTHER_PATIENT_ID | ID | 373 | 0.5% | GDC UUID，每例唯一 |
| INFORMED_CONSENT_VERIFIED | ID/质控（常量） | 373 | 0.5% | 全部 Yes |
| DAYS_LAST_FOLLOWUP | NA（派生冗余） | 304 | 18.9% | 与生存月数冗余，建议用 OS/PFS 月数 |
| DAYS_TO_BIRTH | NA（派生冗余） | 366 | 2.4% | 与 AGE 冗余 |
| manifest.cohort（A/B） | **K 泄漏字段** | 375 | 0 | 由 GRADE 分组直接派生（A=G1/G2，B=G3），禁止作为特征输入 |
| manifest.label（G1/G2 vs G3） | L（当前主终点） | 375 | 0 | 由 GRADE 派生的二分组 |
| manifest.stem / feature_matrix.stem | ID | 375 | 0 | WSI 标识 |
| derived master: primary_slide / primary_kind / n_slides / label_source | ID/B | 375 | 0 | 切片选择溯源与批次 |

## 二、候选标签逐项 QC

### 1) 组织学级别 histologic_grade（当前主终点）——可运行 ✅
- 原始字段：`raw_grade_gdc.json`（GDC 病理报告 GRADE）；cBioPortal `GRADE` 字段在 375 例中 **100% 缺失**（不可用作第二来源）。
- 标准名称：histologic_grade（G 分级）；医学定义：基于腺体分化程度的组织学分级（G1 高分化 / G2 中分化 / G3 低分化-未分化），报告级参考标签，非像素级真值。
- 原始取值：G1=8、G2=136、G3=231；建议分组：G1/G2 vs G3（当前 manifest 定义）；有效患者 375/375，缺失率 0%。
- 患者—WSI 映射：375 例患者 ↔ 953 张 WSI（GDC 库内），映射率 100%；分析层每例固定 1 张 primary 片。
- 冲突数：**0**（cBioPortal GRADE 无值可冲突；GDC 单源自洽）。
- 多切片泄漏风险：**低**——manifest/feature_matrix 无重复病例、无跨 A/B 组病例、每例仅 1 个 stem，且与 master primary 完全一致；但 348/375 例患者在库内另有 1–3 张其他切片，**后续任何扩展分析不得把同例其他切片分入不同组/不同数据集**。
- 纳入排除：GX 9 例已排除、无特征 59 例已排除（见 data/metrics.json）；结论：**可运行**。

### 2) TCGA 分子亚型 tcga_molecular_subtype（含 EBV）——需确认 ⚠️
- 原始字段：cBioPortal `SUBTYPE`；标准名称：TCGA-STAD 分子亚型（CIN/EBV/GS/MSI/POLE，TCGA 2014/2018 多组学分型，研究衍生）。
- 原始取值（队列内）：CIN=192、MSI=59、GS=44、EBV=27、POLE=6；有效 328/375，**缺失率 12.5%（47 例无亚型）**。
- 映射：824 张 WSI，映射率 87.5%；冲突 0（单一来源）。
- **EBV 分子亚型状态**：只能由 SUBTYPE==STAD_EBV 派生（EBV+=27 例，其中 A 组 2、B 组 25）；原始数据中**不存在独立 EBV 检测字段**（无 EBER-ISH/EBV-DNA），组间样本量悬殊，仅适合探索性分层。
- 多切片泄漏风险低（同 GRADE）；纳入排除：47 例无亚型者须剔除或单列；结论：**需确认**（缺失 12.5%、EBV/POLE 小组样本少，需确认分组方案与最小样本量）。

### 3) MSI 状态——区分两个概念，结论不同
- **TCGA MSI 分子亚型**（SUBTYPE==STAD_MSI）：队列内 59 例（A=19、B=40），属分子亚型的一个类别，**可随亚型标签使用（需确认）**。
- **MSI-H／MSI-L／MSS 稳定性**：**缺数据 ❌ 拒绝**。全部 37 个原始字段中无任何 MSI 稳定性字段；`MSI_SENSOR_SCORE`、`MSI_SCORE_MANTIS`、`MSI_FRAC_MUT_INDEL` 在 440 例原始患者与 375 例队列中**均 100% 缺失**；`raw_subtype.json` 为空文件。不得把 STAD_MSI 亚型直接当作 MSI-H 稳定性结论使用。

### 4) 生存终点（OS / DSS / PFS）——需确认 ⚠️
- OS：369/373 有效（缺失 ≤1.6%）；DSS：369/360（≤4.0%）；PFS：370/373（≤1.3%）；DFS 缺失 35%+，**不建议**。
- 来源 cBioPortal 研究衍生随访层；映射率≈98–99%；冲突 0；泄漏风险低。
- 结论：**需确认**（需确认终点选择、删失规则与随访截断；为时间-事件终点，非二分类比较标签）。

## 三、泄漏与一致性核查结果

- manifest 与 feature_matrix 病例集完全一致（375=375，无互相多余）；两文件均无重复病例。
- 无患者跨 A/B 两组；无患者在 manifest 中对应多张 stem；manifest.label 与 GDC GRADE 派生关系 100% 一致（label_grade_mismatch=0）；cohort↔label 映射一致（A=G1/G2、B=G3）。
- manifest.stem 与 master.primary_slide 100% 一致（选片规则：sample 01 优先 DX1→DX2→TS1→TSA→TS2→TSB→BS1）。
- 风险点：348 例患者库内存在多张 WSI（共 953 张映射到队列患者），当前分析每例仅用 1 张 primary——**患者级独立性当前成立**，但任何切片级扩展必须按患者封锁划分。
- 批次注意：AJCC_STAGING_EDITION 混合 4 个版本（7TH/6TH/5TH/4TH），分期类标签比较需按版本分层或重映射。

## 四、可运行性总结

| 标签 | 结论 |
|---|---|
| 组织学级别 G1/G2 vs G3 | **可运行**（375 例、0 缺失、0 冲突、泄漏核查通过） |
| TCGA 分子亚型（5 类）/ EBV 亚型状态 | **需确认**（缺失 12.5%；EBV+ 仅 27 例且 A/B 分布 2/25；POLE 仅 6 例） |
| TCGA MSI 分子亚型 | 需确认（同上，59 例） |
| MSI-H／MSI-L／MSS 稳定性 | **缺数据，拒绝**（无任何稳定性字段；MSI 评分 100% 缺失；raw_subtype.json 为空） |
| OS / DSS / PFS | 需确认（生存终点规则待定）；DFS 不建议（缺失 35%） |
| TNM / AJCC 分期 | 需确认（覆盖好，但分期版本混杂需处理） |

未启动任何差异分析、模型训练或诊断性结论；等待您确认标签定义与分组方案。
