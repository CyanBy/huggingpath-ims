export type ModelStatus = 'Active' | 'Testing' | 'Not Configured' | 'Unavailable';

export interface ModelCatalogItem {
  id: string;
  name: string;
  status: ModelStatus;
  summary: string;
}

export const MODEL_CATALOG: ModelCatalogItem[] = [
  {
    id: 'ai4path/cellvit-v2',
    name: 'CellViT V2',
    status: 'Active',
    summary: '基于Vision Transformer的细胞核分割与分类模型，支持多种组织类型的H&E染色切片分析。',
  },
  {
    id: 'patho/hover-net-gastric',
    name: 'Hover-Net 胃部分割',
    status: 'Active',
    summary: '针对胃部病理切片的细胞核实例分割模型，在DigestPath数据集上达到SOTA性能。',
  },
  {
    id: 'uni/tiatoolbox-seg',
    name: 'TIAToolbox 通用分割',
    status: 'Testing',
    summary: '通用的病理图像分割工具箱，集成多种经典分割算法，支持快速迁移学习。',
  },
  {
    id: 'deeppath/lung-tumor-cls',
    name: '肺癌分类模型',
    status: 'Active',
    summary: '基于ResNet-50的肺腺癌与鳞癌分类模型，准确率96.2%，支持WSI级推理。',
  },
  {
    id: 'oppen/prostate-grade',
    name: '前列腺癌分级',
    status: 'Not Configured',
    summary: 'Gleason评分自动分级模型，识别前列腺癌组织的分级模式，支持ISUP 2014标准。',
  },
  {
    id: 'brainpath/glioma-seg',
    name: '胶质瘤分割模型',
    status: 'Active',
    summary: '针对H&E染色脑组织切片的胶质瘤区域分割，支持坏死、强化及非强化肿瘤区域识别。',
  },
  {
    id: 'spatial/slide-analysis-v1',
    name: '空间蛋白组分析',
    status: 'Unavailable',
    summary: '多重免疫荧光(MxIF)图像的空间蛋白组分析套件，支持细胞邻域分析和通路富集。',
  },
  {
    id: 'kidney-ai/glomeruli-detect',
    name: '肾小球检测模型',
    status: 'Testing',
    summary: '肾脏病理切片中肾小球自动检测与分割，支持PAS染色，输出形态学量化指标。',
  },
];

export function getCatalogModel(modelId: string | null) {
  if (!modelId) return null;
  return MODEL_CATALOG.find((model) => model.id === modelId) || null;
}
