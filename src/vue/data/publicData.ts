export type PublicCase = {
  caseId: string
  description: string
  patient: string
  patientMeta: string
  site: string
  sampling: string
  slideCount: number
  status: '未分析' | '分析中' | '分析完成' | '分析失败'
  createdAt: string
}

export const publicCases: PublicCase[] = [
  { caseId: '25AH032093', description: '门诊 · 胃活检', patient: '患者A', patientMeta: '男 · 58岁', site: '胃', sampling: '活检', slideCount: 3, status: '分析完成', createdAt: '04-28' },
  { caseId: '25BR018762', description: '住院 · 乳腺穿刺', patient: '患者B', patientMeta: '女 · 46岁', site: '乳腺', sampling: '活检', slideCount: 1, status: '未分析', createdAt: '04-27' },
  { caseId: '25CX009871', description: '宫颈 TCT', patient: '患者C', patientMeta: '女 · 39岁', site: '宫颈', sampling: '细胞学', slideCount: 1, status: '分析中', createdAt: '04-26' },
  { caseId: '25PR004356', description: '前列腺穿刺', patient: '患者D', patientMeta: '男 · 67岁', site: '前列腺', sampling: '活检', slideCount: 0, status: '未分析', createdAt: '04-25' },
  { caseId: '25LG010882', description: '肺穿刺', patient: '患者E', patientMeta: '男 · 61岁', site: '肺', sampling: '活检', slideCount: 2, status: '分析失败', createdAt: '04-24' },
]

export type PublicProject = {
  id: string
  name: string
  summary: string
  organization: string
  owner: string
  members: number
  disease: string
  dataType: string
  tags: string[]
  caseCount: number
  wsiCount: number
  analysisCount: number
  policy: '可直接下载' | '申请下载' | '仅查看'
  updatedAt: string
  views: string
}

export const publicProjects: PublicProject[] = [
  { id: 'PRJ-PUB-2026-001', name: '乳腺癌 HER2 队列研究', summary: '面向乳腺癌 HER2 IHC 定量分析的公开研究项目，包含多中心 Case、WSI 与 AI 分析结果摘要。', organization: '仁达病理中心', owner: 'Zhang San', members: 8, disease: 'Breast Cancer', dataType: 'IHC', tags: ['HER2', 'IHC', 'Breast Cancer'], caseCount: 128, wsiCount: 356, analysisCount: 24, policy: '申请下载', updatedAt: '2026-05-20', views: '2.8k' },
  { id: 'PRJ-PUB-2026-002', name: '胃癌活检组织区域分割项目', summary: '公开展示胃癌活检 HE 切片中的肿瘤区、间质区和坏死区域分割结果。', organization: 'AI Lab', owner: 'Li Ming', members: 5, disease: 'Gastric Cancer', dataType: 'HE', tags: ['Gastric Cancer', 'HE', 'Segmentation'], caseCount: 96, wsiCount: 214, analysisCount: 18, policy: '可直接下载', updatedAt: '2026-05-18', views: '1.9k' },
  { id: 'PRJ-PUB-2026-003', name: '肺癌肿瘤微环境分析项目', summary: '围绕肺癌 HE 与 IHC 多模态切片，公开展示免疫细胞空间分布、热点区域与 TME 统计。', organization: '示例医院', owner: 'Dr. Chen', members: 11, disease: 'Lung Cancer', dataType: '多模态', tags: ['Lung Cancer', 'TME', 'IHC'], caseCount: 72, wsiCount: 188, analysisCount: 31, policy: '仅查看', updatedAt: '2026-05-16', views: '3.4k' },
  { id: 'PRJ-PUB-2026-004', name: '淋巴结转移癌检测验证项目', summary: '展示 WSI 级别检测结果、疑似病灶区域和模型输出摘要。', organization: '科研团队', owner: 'Wang Yu', members: 6, disease: 'Lymph Node', dataType: 'HE', tags: ['Metastasis', 'Detection', 'WSI'], caseCount: 64, wsiCount: 148, analysisCount: 16, policy: '申请下载', updatedAt: '2026-05-14', views: '1.2k' },
  { id: 'PRJ-PUB-2026-005', name: '宫颈活检病变识别项目', summary: '公开展示宫颈活检切片中上皮区域、可疑病变区域和 AI 辅助识别结果。', organization: '联合病理实验室', owner: 'Liu Fang', members: 9, disease: 'Cervical Cancer', dataType: 'HE', tags: ['Cervical Cancer', 'Biopsy', 'AI'], caseCount: 88, wsiCount: 201, analysisCount: 19, policy: '仅查看', updatedAt: '2026-05-12', views: '2.1k' },
]
