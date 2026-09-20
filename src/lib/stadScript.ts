/**
 * STAD 队列科研演示剧本：素材来自 stad_pm_package（TCGA-STAD 375 例真实队列产物）。
 * 铁律：所有数字必须与本模块一致（来自包内文件），不得编造。
 */
import type { AgentArtifact, AgentThinkingStep } from './agentSessions';

/** STAD 演示项目的固定 ID（种子与剧本共用） */
export const STAD_PROJECT_ID = 'PRJ-STAD-DEMO';

export type StadReply = {
  text: string;
  thinkingSteps: AgentThinkingStep[];
  artifacts: AgentArtifact[];
};

const FIG = (name: string) => `/stad/figures/${name}`;
const TAB = (name: string) => `/stad/tables/${name}`;

const cohortReply: StadReply = {
  thinkingSteps: [
    { tool: 'read_table', label: '读取 cohort_manifest.csv', detail: '375 例病例清单与分组', status: 'done' },
    { tool: 'read_table', label: '核对标签审计 cohort_label_inventory.md', detail: '37 字段 · 泄漏/混杂/批次已分类', status: 'done' },
    { tool: 'qc_features', label: '确认特征矩阵规模', detail: '951 项 TME 特征 → 851 项合格', status: 'done' },
  ],
  text: '这是 **TCGA-STAD 胃腺癌队列**，共 **375 例**患者（每例一张 primary 诊断片），按组织学分级分两组：**G1/G2 低级别 144 例** vs **G3 高级别 231 例**。\n\n特征为 TME 模型提取的 **951 项**肿瘤微环境特征（细胞核形态/密度、空间分布、Ripley\'s K 等），质控后 **851 项合格**。标签体系含分子亚型（328 例）、OS/DSS/PFS 生存终点与 TNM 分期。\n\n注：所有标签均为研究衍生层，非临床病理报告原件。',
  artifacts: [
    { kind: 'table', label: 'cohort_manifest.csv', path: TAB('cohort_manifest.csv'), desc: '375 例病例清单与分组' },
    { kind: 'file', label: 'cohort_label_inventory.md', path: TAB('cohort_label_inventory.md'), desc: '37 字段标签审计报告' },
  ],
};

const diffReply: StadReply = {
  thinkingSteps: [
    { tool: 'run_stats', label: 'Mann-Whitney U + Cohen\'s d', detail: '851 项合格特征逐一检验', status: 'done' },
    { tool: 'adjust_fdr', label: 'BH-FDR 多重校正', detail: '按 |d| 排序取 Top 10', status: 'done' },
    { tool: 'plot_violin', label: '绘制病例级小提琴图', detail: 'Top 10 差异特征', status: 'done' },
  ],
  text: '两组共检验 **851** 个特征，差异 Top10 全部 **FDR<0.05**、**|d|>0.64**（中-大效应）。前三位：\n\n1. **EMT_SCORE_STD**（d=-0.71）：G3 的 EMT 评分空间异质性更低，符合去分化表型\n2. **LATTICE_FORMATION_INDEX**（d=+0.70）：G3 格子样结构更显著，与高级别癌巢推挤式生长相关\n3. **ZONE4_T_STD_CIRC**（d=-0.70）：肿瘤核圆度空间异质性下降，核形更单一\n\n整体模式：G3 呈「**核形态均一化 + 间质反应增强 + 免疫-肿瘤距离缩短**」，与高级别胃癌的去分化、促间质病理特征一致。',
  artifacts: [
    { kind: 'image', label: 'violin_top10_G1G2vsG3.png', path: FIG('violin_top10_G1G2vsG3.png'), desc: 'Top10 差异特征小提琴图' },
    { kind: 'table', label: 'diff_top10_G1G2vsG3.csv', path: TAB('diff_top10_G1G2vsG3.csv'), desc: '差异排序（d 值 / FDR）' },
    { kind: 'table', label: 'violin_top10_stats.csv', path: TAB('violin_top10_stats.csv'), desc: '小提琴图统计明细' },
  ],
};

const classifyReply: StadReply = {
  thinkingSteps: [
    { tool: 'split_cohort', label: '分层留出', detail: 'train 263 / held-out 112 · seed=42', status: 'done' },
    { tool: 'train_model', label: 'L2 逻辑回归', detail: '训练集内按 |d| 选 top-10 特征', status: 'done' },
    { tool: 'evaluate', label: '独立留出集评估', detail: '+ 5 折交叉验证 + 混杂检查', status: 'done' },
  ],
  text: '可以区分，但结论要克制。独立留出集 **AUROC 0.777**（95% CI 0.687–0.861），5 折 CV 0.737±0.069。\n\n特征越少越弱：**Top3 差异特征**单独分类 AUC **0.696**，**全量合格特征** AUC **0.740**。\n\n结论：TME 特征对组织学分级有中等区分力，适合作为科研假设生成的依据，不足以单独替代分级判定。',
  artifacts: [
    { kind: 'image', label: 'roc_trainfold_top3.png', path: FIG('roc_trainfold_top3.png'), desc: 'Top3 特征 ROC（AUC 0.696）' },
    { kind: 'image', label: 'roc_all_features.png', path: FIG('roc_all_features.png'), desc: '全量特征 ROC（AUC 0.740）' },
    { kind: 'file', label: 'heldout_metrics.json', path: TAB('heldout_metrics.json'), desc: '留出集评估指标与混杂检查' },
    { kind: 'file', label: 'classification_report.json', path: TAB('classification_report.json'), desc: '分类实验完整报告' },
  ],
};

const tsneReply: StadReply = {
  thinkingSteps: [
    { tool: 'match_labels', label: '匹配 cBioPortal 分子亚型标签', detail: '328/375 例纳入（POLE 仅 6 例）', status: 'done' },
    { tool: 'run_tsne', label: '845 个有效特征联合 t-SNE', detail: '按亚型着色', status: 'done' },
    { tool: 'run_stats', label: 'Kruskal-Wallis + η²', detail: '亚型区分度 Top10 特征', status: 'done' },
  ],
  text: '**328 例**纳入分析（CIN 192 / MSI 59 / GS 44 / EBV 27 / **POLE 仅 6 例**，POLE 结论仅为探索性）。\n\nt-SNE 上 **MSI 与 EBV 呈可见聚集**，符合两者免疫活性较高的已知生物学；CIN 与 GS 重叠较多。亚型区分度 Top10 特征（Kruskal-Wallis + η²）首位为**肿瘤区间质细胞占比**（η²=0.166），其次为 TILs 细胞占比。',
  artifacts: [
    { kind: 'image', label: 'tsne_molecular_subtype.png', path: FIG('tsne_molecular_subtype.png'), desc: '按分子亚型着色的 t-SNE' },
    { kind: 'image', label: 'violin_top10_subtype.png', path: FIG('violin_top10_subtype.png'), desc: '亚型 Top10 特征小提琴图' },
    { kind: 'table', label: 'subtype_top10_features.csv', path: TAB('subtype_top10_features.csv'), desc: '亚型特征排序（η² / FDR）' },
  ],
};

const survivalReply: StadReply = {
  thinkingSteps: [
    { tool: 'select_features', label: '5 折交叉内筛选特征', detail: 'Cox 比例风险 · penalizer 1.0', status: 'done' },
    { tool: 'stratify', label: '按风险评分中位数分层', detail: '绘制 KM 曲线', status: 'done' },
    { tool: 'bootstrap', label: '200 次 bootstrap 校验', detail: '终点 OS · 删失规则见产物', status: 'done' },
  ],
  text: '可以。**筛选特征模型**的风险分层把队列分为预后显著不同的两组（见 KM 曲线）；**全量特征模型**分层趋势一致，但曲线分离度略低，说明 TME 特征携带可重复的预后信号。\n\n提醒：终点与删失沿用源表定义，结论为**队列级科研关联**，不可外推至个体预后预测。',
  artifacts: [
    { kind: 'image', label: 'survival_km_selected.png', path: FIG('survival_km_selected.png'), desc: '筛选特征模型 KM 曲线' },
    { kind: 'image', label: 'survival_km_compare.png', path: FIG('survival_km_compare.png'), desc: '筛选 vs 全量模型对比' },
    { kind: 'image', label: 'survival_os_selected.png', path: FIG('survival_os_selected.png'), desc: 'OS 风险分层（筛选模型）' },
    { kind: 'file', label: 'os_survival_summary.json', path: TAB('os_survival_summary.json'), desc: '生存分析参数与终点定义' },
  ],
};

/** 按提问匹配 STAD 演示剧本，命中返回回复，否则返回 null */
export function matchStadReply(question: string): StadReply | null {
  const q = question.toLowerCase();
  if (/介绍一下.*队列|队列.*介绍|这个队列|队列.*情况|队列.*信息/.test(q)) return cohortReply;
  if (/差异|top\s?10|小提琴/.test(q)) return diffReply;
  if (/分类|能区分|区分.*两组|roc|auc/.test(q)) return classifyReply;
  if (/t-?sne|tsne|降维|聚类|怎么聚|亚型/.test(q)) return tsneReply;
  if (/预后|生存|km|风险分层/.test(q)) return survivalReply;
  return null;
}

/** 预置演示会话的 5 轮问答（与 matchStadReply 共用内容） */
export function getStadDemoScript(): { q: string; a: StadReply }[] {
  return [
    { q: '介绍一下这个队列', a: cohortReply },
    { q: '两组之间 TME 特征差异最大的是哪些？画出来', a: diffReply },
    { q: '这些特征能区分两组吗？跑个分类实验', a: classifyReply },
    { q: '做个 t-SNE 看看病例怎么聚', a: tsneReply },
    { q: '筛出的特征能预测预后吗？', a: survivalReply },
  ];
}
