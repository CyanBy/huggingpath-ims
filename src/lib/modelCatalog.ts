export type ModelStatus = 'Active' | 'Testing' | 'Not Configured' | 'Unavailable';

export interface ModelCatalogItem {
  id: string;
  name: string;
  status: ModelStatus;
  summary: string;
  analysisDescription: string;
  supportedStains: string[];
}

export const MODEL_CATALOG: ModelCatalogItem[] = [
  {
    id: 'ai4path/cellvit-v2',
    name: 'CellViT V2',
    status: 'Active',
    summary: '基于Vision Transformer的细胞核分割与分类模型，支持多种组织类型的H&E染色切片分析。',
    analysisDescription: '细胞核检测与分割',
    supportedStains: ['H&E', 'HE', 'Ki-67', 'Ki67', 'HER2', 'PAS', 'IHC'],
  },
  {
    id: 'mod-tme',
    name: 'TME Analyzer',
    status: 'Active',
    summary: '面向H&E染色切片的肿瘤微环境分析模型，量化组织区域、细胞核组成与空间分布特征。',
    analysisDescription: '肿瘤微环境分析',
    supportedStains: ['H&E', 'HE'],
  },
];

export function getCatalogModel(modelId: string | null) {
  if (!modelId) return null;
  return MODEL_CATALOG.find((model) => model.id === modelId) || null;
}
