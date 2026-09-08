export interface SparkFeatureDefinition {
  id: string
  name: string
  category: string
  value: string
  unit?: string
  popular: boolean
  spatial: boolean
}

export const SPARK_FEATURE_CATEGORIES = [
  'CollagenMean',
  'CollagenStd',
  'Global',
  'RegionMean',
  'RegionStd',
  'Ripley空间聚集',
  'RoiMean',
  'RoiStd',
  '综合特征',
  'TILs浸润评分',
  '区域像素计数',
  '区域形态',
  '区域核组成',
  '区域计数',
  '区域邻域',
  '基质细胞密度',
  '复合微环境表型',
  '显著性',
  '染色强度/纹理',
  '核大小',
  '核形态',
  '核方向',
  '空间组织/细胞互作',
  '细胞核形态/方向',
  '细胞核计数',
  '细胞组成/密度比例',
  '肿瘤边界/浸润梯度',
] as const

const CORE_FEATURE_CATEGORIES = [
  '基质细胞密度',
  '细胞组成/密度比例',
  '细胞核形态/方向',
  '空间组织/细胞互作',
  '复合微环境表型',
  '核方向',
  '复合微环境表型',
  '复合微环境表型',
  '染色强度/纹理',
  '细胞组成/密度比例',
  '区域邻域',
  '区域邻域',
  '空间组织/细胞互作',
  '区域邻域',
  '肿瘤边界/浸润梯度',
  '区域形态',
  '区域形态',
  '细胞核形态/方向',
  '染色强度/纹理',
  '染色强度/纹理',
  '染色强度/纹理',
  '染色强度/纹理',
  '区域形态',
  '空间组织/细胞互作',
  '空间组织/细胞互作',
] as const

const CORE_FEATURES = [
  ['FIBROBLAST DENSITY PER MM2', '186.4', '/mm²'],
  ['FIBROBLAST STROMAL RATIO', '0.432'],
  ['MEAN CLUSTER AREA UM2', '0.465', 'μm²'],
  ['BRANCH POINTS PER MM2', '0.640', '/mm²'],
  ['MAX BRANCHING SCORE', '0.846'],
  ['ORIENTATION STD DEG', '171.110', '°'],
  ['MEAN MYOFIBRO INDEX', '0.869'],
  ['MEDIAN MYOFIBRO INDEX', '3.472'],
  ['MEAN TEXTURE DIFF', '0.327'],
  ['LYMPH FIB RATIO', '0.0946'],
  ['FIBROBLAST LYMPHOCYTE PROXIMITY', '0.718'],
  ['MEAN MIN DISTANCE UM', '13.660', 'μm'],
  ['TRIAD CONTACT SCORE', '0.111'],
  ['FIBROBLAST PROXIMITY INDEX', '0.830'],
  ['MEAN TUMOR GRADIENT', '1.21e-4'],
  ['MEAN RING COMPLETENESS', '0.462'],
  ['ASPECT RATIO DIFFERENCE', '-0.128'],
  ['TUMOR MEAN ASPECT RATIO', '1.579'],
  ['MAX NUCLEAR COLOR DIFF', '0.000'],
  ['MEAN NUCLEAR COLOR DIFF', '0.000'],
  ['MIN NUCLEAR COLOR DIFF', '0.000'],
  ['SD NUCLEAR COLOR DIFF', '0.000'],
  ['MEAN POCKET AREA UM2', '52754.269', 'μm²'],
  ['CONNECTIVITY SCORE', '0.111'],
  ['LATTICE FORMATION INDEX', '0.830'],
] as const

function generatedValue(index: number) {
  const normalized = (Math.sin((index + 1) * 0.83) + Math.cos((index + 3) * 0.39)) / 4 + 0.5
  if (index % 9 === 0) return (normalized * 0.00024).toExponential(2)
  if (index % 7 === 0) return (normalized * 12 - 4).toFixed(3)
  if (index % 5 === 0) return (normalized * 180).toFixed(1)
  return normalized.toFixed(3)
}

export const SPARK_FEATURES: SparkFeatureDefinition[] = Array.from({ length: 951 }, (_, index) => {
  const core = CORE_FEATURES[index]
  return {
    id: `spark-${index + 1}`,
    name: core?.[0] || `FEATURE ${String(index + 1).padStart(3, '0')}`,
    category: CORE_FEATURE_CATEGORIES[index] || SPARK_FEATURE_CATEGORIES[index % SPARK_FEATURE_CATEGORIES.length],
    value: core?.[1] || generatedValue(index),
    unit: core?.[2],
    popular: index < 18 || index % 29 === 0,
    spatial: index < 14 || index % 4 === 0,
  }
})

export const SPARK_VALID_FEATURE_COUNT = 936

export function getSparkSlideSummary(objectIndex: number) {
  const index = Math.max(0, objectIndex)
  return {
    featureCount: SPARK_FEATURES.length,
    validCount: SPARK_VALID_FEATURE_COUNT,
    cellCount: 151498 + index * 14882,
    roiCount: 80 + index * 7,
    seconds: Number((6482.8 + index * 137.4).toFixed(1)),
  }
}
