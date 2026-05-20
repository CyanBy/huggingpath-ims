import { useMemo, useState } from 'react';
import { FileText, Plus, Trash2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type CaseStatus = '就绪' | '处理中' | '异常' | '待处理';

type CaseRow = {
  sampleId: string;
  site: string;
  researchCategory: string;
  samplingMethod: string;
  ageGroup: string;
  sex: '男' | '女' | '未知';
  wsiCount: number;
  status: CaseStatus;
  createdAt: string;
  remark?: string;
};

type NewCaseWsi = {
  id: string;
  fileName: string;
  stain: string;
  magnification: string;
  size: string;
};

const initialCases: CaseRow[] = [
  { sampleId: 'S-20260517-1906', site: 'lung', researchCategory: '炎性病变（研究分类）', samplingMethod: 'biopsy', ageGroup: '41-60', sex: '女', wsiCount: 2, status: '就绪', createdAt: '2026-02-25' },
  { sampleId: 'S-20260209-6099', site: 'kidney', researchCategory: '浸润性导管癌（研究分类）', samplingMethod: 'surgical', ageGroup: '19-40', sex: '男', wsiCount: 2, status: '就绪', createdAt: '2026-03-23' },
  { sampleId: 'S-20260114-3036', site: 'thyroid', researchCategory: '良性病变（研究分类）', samplingMethod: 'surgical', ageGroup: '41-60', sex: '男', wsiCount: 4, status: '就绪', createdAt: '2026-02-25' },
  { sampleId: 'S-20260402-9407', site: 'thyroid', researchCategory: '腺瘤（研究分类）', samplingMethod: 'biopsy', ageGroup: '19-40', sex: '女', wsiCount: 3, status: '就绪', createdAt: '2026-04-08' },
  { sampleId: 'S-20251122-5123', site: 'thyroid', researchCategory: '良性病变（研究分类）', samplingMethod: 'surgical', ageGroup: '19-40', sex: '男', wsiCount: 3, status: '就绪', createdAt: '2026-04-29' },
  { sampleId: 'S-20260427-6800', site: 'liver', researchCategory: '炎性病变（研究分类）', samplingMethod: 'surgical', ageGroup: '19-40', sex: '男', wsiCount: 3, status: '就绪', createdAt: '2026-05-03' },
  { sampleId: 'S-20251129-0750', site: 'kidney', researchCategory: '腺瘤（研究分类）', samplingMethod: 'surgical', ageGroup: '41-60', sex: '女', wsiCount: 4, status: '就绪', createdAt: '2026-05-11' },
  { sampleId: 'S-20260515-4367', site: 'thyroid', researchCategory: '浸润性导管癌（研究分类）', samplingMethod: 'biopsy', ageGroup: '41-60', sex: '男', wsiCount: 2, status: '就绪', createdAt: '2026-03-16' },
  { sampleId: 'S-20260129-6047', site: 'stomach', researchCategory: '良性病变（研究分类）', samplingMethod: 'biopsy', ageGroup: '61+', sex: '男', wsiCount: 2, status: '就绪', createdAt: '2026-04-15' },
  { sampleId: 'S-20260504-9169', site: 'kidney', researchCategory: '炎性病变（研究分类）', samplingMethod: 'surgical', ageGroup: '41-60', sex: '男', wsiCount: 4, status: '就绪', createdAt: '2026-04-17' },
  { sampleId: 'S-20251207-7468', site: 'lung', researchCategory: '良性病变（研究分类）', samplingMethod: 'biopsy', ageGroup: '41-60', sex: '女', wsiCount: 2, status: '就绪', createdAt: '2026-02-23' },
  { sampleId: 'S-20260126-4765', site: 'colon', researchCategory: '腺瘤（研究分类）', samplingMethod: 'surgical', ageGroup: '41-60', sex: '男', wsiCount: 2, status: '就绪', createdAt: '2026-03-24' },
  { sampleId: 'S-20251221-0796', site: 'liver', researchCategory: '炎性病变（研究分类）', samplingMethod: 'biopsy', ageGroup: '19-40', sex: '男', wsiCount: 4, status: '就绪', createdAt: '2026-03-28' },
  { sampleId: 'S-20260107-6890', site: 'colon', researchCategory: '浸润性导管癌（研究分类）', samplingMethod: 'surgical', ageGroup: '19-40', sex: '男', wsiCount: 4, status: '就绪', createdAt: '2026-04-22' },
  { sampleId: 'S-20251123-6531', site: 'breast', researchCategory: '良性病变（研究分类）', samplingMethod: 'surgical', ageGroup: '41-60', sex: '男', wsiCount: 3, status: '就绪', createdAt: '2026-03-08' },
];

const projectOptions = ['按项目筛选', '肺部研究项目', '肾脏研究项目', '甲状腺研究项目', '消化道研究项目'];
const siteOptions = ['lung', 'kidney', 'thyroid', 'stomach', 'colon', 'liver', 'breast'];
const categoryOptions = ['炎性病变（研究分类）', '浸润性导管癌（研究分类）', '良性病变（研究分类）', '腺瘤（研究分类）', '新增研究分类'];
const samplingOptions = ['biopsy', 'surgical', 'cytology', 'other'];
const ageGroupOptions = ['未知', '0-18', '19-40', '41-60', '61+'];

function ProjectSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div
      onClick={() => setOpen((prev) => !prev)}
      className={`relative h-9 w-[220px] rounded-md border bg-[#17181d] px-3 flex items-center justify-between cursor-pointer select-none ${
        open ? 'border-[#8f35b7] shadow-[0_0_0_2px_rgba(143,53,183,0.22)]' : 'border-white/[0.08]'
      }`}
    >
      <span className="text-[#76809a] text-sm">{value}</span>
      <span className="text-[#64748b] text-sm">⌄</span>

      {open && (
        <div className="absolute left-0 right-0 top-[42px] z-20 rounded-md border border-white/[0.08] bg-[#202126] p-1 shadow-[0_16px_48px_rgba(0,0,0,0.4)]">
          {projectOptions.map((item) => (
            <div
              key={item}
              onClick={(event) => {
                event.stopPropagation();
                onChange(item);
                setOpen(false);
              }}
              className={`h-8 px-2.5 rounded text-sm flex items-center ${
                item === value
                  ? 'bg-[#8f35b7]/20 text-[#d292f4]'
                  : 'text-[#cbd5e1] hover:bg-white/[0.05]'
              }`}
            >
              {item}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SexBadge({ sex }: { sex: CaseRow['sex'] }) {
  const cls =
    sex === '女'
      ? 'border-[#8f2d5b] bg-[#8f2d5b]/20 text-[#f472b6]'
      : sex === '男'
        ? 'border-[#334155] bg-[#334155]/35 text-[#cbd5e1]'
        : 'border-white/[0.08] bg-white/[0.05] text-[#94a3b8]';

  return (
    <span className={`h-6 min-w-6 px-2 rounded inline-flex items-center justify-center text-xs border ${cls}`}>
      {sex}
    </span>
  );
}

function StatusBadge({ status }: { status: CaseStatus }) {
  const cls =
    status === '就绪'
      ? 'border-[#3f6212] bg-[#3f6212]/45 text-[#84cc16]'
      : status === '处理中'
        ? 'border-[#8f35b7]/40 bg-[#8f35b7]/20 text-[#d292f4]'
        : status === '待处理'
          ? 'border-white/[0.08] bg-white/[0.05] text-[#94a3b8]'
          : 'border-[#991b1b] bg-[#991b1b]/30 text-[#fca5a5]';

  return (
    <span className={`h-6 px-2 rounded inline-flex items-center text-xs border ${cls}`}>
      {status}
    </span>
  );
}

function FieldLabel({ children, required }: { children: string; required?: boolean }) {
  return (
    <label className="block text-sm text-[#cbd5e1] mb-2">
      {children} {required && <span className="text-[#ff8f8f]">*</span>}
    </label>
  );
}

export default function WorkbenchCaseLibrary() {
  const navigate = useNavigate();
  const [project, setProject] = useState('按项目筛选');
  const [keyword, setKeyword] = useState('');
  const [caseRows, setCaseRows] = useState<CaseRow[]>(initialCases);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSampleId, setNewSampleId] = useState('');
  const [newSite, setNewSite] = useState('stomach');
  const [newCategory, setNewCategory] = useState('新增研究分类');
  const [newSamplingMethod, setNewSamplingMethod] = useState('biopsy');
  const [newAgeGroup, setNewAgeGroup] = useState('41-60');
  const [newSex, setNewSex] = useState<CaseRow['sex']>('未知');
  const [newRemark, setNewRemark] = useState('');
  const [selectedWsiList, setSelectedWsiList] = useState<NewCaseWsi[]>([]);

  const filteredCases = useMemo(() => {
    if (!keyword.trim()) return caseRows;

    const q = keyword.trim().toLowerCase();

    return caseRows.filter((item) => {
      const text = `${item.sampleId} ${item.site} ${item.researchCategory} ${item.samplingMethod} ${item.ageGroup} ${item.sex} ${item.remark || ''}`.toLowerCase();
      return text.includes(q);
    });
  }, [caseRows, keyword]);

  const resetCreateForm = () => {
    setNewSampleId('');
    setNewSite('stomach');
    setNewCategory('新增研究分类');
    setNewSamplingMethod('biopsy');
    setNewAgeGroup('41-60');
    setNewSex('未知');
    setNewRemark('');
    setSelectedWsiList([]);
  };

  const closeCreateModal = () => {
    resetCreateForm();
    setShowCreateModal(false);
  };

  const addMockWsi = () => {
    const baseId = newSampleId.trim() || `S-20260520-${String(7000 + caseRows.length + 1).padStart(4, '0')}`;
    const timestamp = Date.now();

    const nextWsi: NewCaseWsi[] = [
      {
        id: `wsi-${timestamp}-1`,
        fileName: `${baseId}_HE_001.svs`,
        stain: 'HE',
        magnification: '40X',
        size: '1.24 GB',
      },
      {
        id: `wsi-${timestamp}-2`,
        fileName: `${baseId}_IHC_Ki67_001.svs`,
        stain: 'Ki67',
        magnification: '40X',
        size: '982 MB',
      },
    ];

    setSelectedWsiList((prev) => [...nextWsi, ...prev]);
  };

  const removeWsi = (id: string) => {
    setSelectedWsiList((prev) => prev.filter((item) => item.id !== id));
  };

  const createCase = () => {
    if (!newSampleId.trim() || !newSite.trim() || !newCategory.trim()) return;

    const nextCase: CaseRow = {
      sampleId: newSampleId.trim(),
      site: newSite,
      researchCategory: newCategory,
      samplingMethod: newSamplingMethod,
      ageGroup: newAgeGroup,
      sex: newSex,
      wsiCount: selectedWsiList.length,
      status: selectedWsiList.length > 0 ? '就绪' : '待处理',
      createdAt: '2026-05-20',
      remark: newRemark.trim(),
    };

    setCaseRows((prev) => [nextCase, ...prev]);
    closeCreateModal();
  };

  return (
    <div className="min-h-[calc(100dvh-64px)] bg-[#0f1014] text-[#e5e7eb] px-4 pt-3 pb-6">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[24px] leading-8 font-bold text-[#f8fafc]">Case 管理</h1>
          <p className="text-sm text-[#64748b] mt-1">所有样本均已去标识化，遵循科研伦理规范</p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="h-9 px-4 rounded-md bg-[#8f35b7] text-white text-sm font-medium hover:bg-[#a64ed0] transition-all inline-flex items-center gap-2 shrink-0"
        >
          <Plus size={16} />
          新增 Case
        </button>
      </div>

      <div className="rounded-md border border-white/[0.08] bg-[#202126] px-4 pt-4 pb-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-9 w-[210px] rounded-md border border-white/[0.08] bg-[#17181d] px-3 flex items-center gap-2">
            <span className="text-[#94a3b8] text-sm">⌕</span>
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              className="w-full bg-transparent outline-none text-sm text-[#cbd5e1] placeholder:text-[#64748b]"
              placeholder="样本编号 / 备注"
            />
          </div>

          <ProjectSelect value={project} onChange={setProject} />
        </div>

        <div className="overflow-hidden rounded-md">
          <table className="w-full table-fixed border-collapse text-sm">
            <thead>
              <tr className="bg-[#252730] text-[#cbd5e1]">
                <th className="h-10 px-3 text-left font-semibold" style={{ width: '16%' }}>样本编号</th>
                <th className="h-10 px-3 text-left font-semibold" style={{ width: '8%' }}>取材部位</th>
                <th className="h-10 px-3 text-left font-semibold" style={{ width: '20%' }}>研究分类</th>
                <th className="h-10 px-3 text-left font-semibold" style={{ width: '9%' }}>取材方式</th>
                <th className="h-10 px-3 text-left font-semibold" style={{ width: '7%' }}>年龄段</th>
                <th className="h-10 px-3 text-left font-semibold" style={{ width: '6%' }}>性别</th>
                <th className="h-10 px-3 text-left font-semibold" style={{ width: '7%' }}>WSI 数</th>
                <th className="h-10 px-3 text-left font-semibold" style={{ width: '8%' }}>状态</th>
                <th className="h-10 px-3 text-left font-semibold" style={{ width: '11%' }}>创建时间</th>
                <th className="h-10 px-3 text-left font-semibold" style={{ width: '8%' }}>操作</th>
              </tr>
            </thead>

            <tbody>
              {filteredCases.map((item) => (
                <tr
                  key={item.sampleId}
                  className="border-b border-white/[0.06] text-[#d1d5db] hover:bg-white/[0.025]"
                >
                  <td className="h-10 px-3 font-mono text-[#e5e7eb]">{item.sampleId}</td>
                  <td className="h-10 px-3">{item.site}</td>
                  <td className="h-10 px-3">{item.researchCategory}</td>
                  <td className="h-10 px-3">{item.samplingMethod}</td>
                  <td className="h-10 px-3">{item.ageGroup}</td>
                  <td className="h-10 px-3">
                    <SexBadge sex={item.sex} />
                  </td>
                  <td className="h-10 px-3">
                    <span className="h-6 min-w-6 px-2 rounded border border-[#8f35b7]/35 bg-[#8f35b7]/15 text-[#d292f4] inline-flex items-center justify-center text-xs">
                      {item.wsiCount}
                    </span>
                  </td>
                  <td className="h-10 px-3">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="h-10 px-3">{item.createdAt}</td>
                  <td className="h-10 px-3">
                    <button
                      type="button"
                      onClick={() => navigate(`/cases/${item.sampleId}`)}
                      className="text-[#d292f4] hover:text-[#f0b7ff] text-sm"
                    >
                      查看
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="h-12 flex items-center justify-end gap-3 text-[#64748b]">
          <button className="text-[#64748b] hover:text-[#cbd5e1]">‹</button>
          <button className="w-6 h-6 rounded-md border border-[#8f35b7] bg-[#8f35b7]/15 text-[#d292f4] text-sm">1</button>
          <button className="text-[#cbd5e1] text-sm">2</button>
          <button className="text-[#cbd5e1] text-sm">3</button>
          <button className="text-[#64748b] hover:text-[#cbd5e1]">›</button>
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="w-[760px] max-h-[88vh] rounded-2xl border border-white/[0.08] bg-[#202126] shadow-[0_24px_80px_rgba(0,0,0,0.55)] overflow-hidden flex flex-col">
            <div className="h-16 px-6 border-b border-white/[0.06] flex items-center justify-between shrink-0">
              <div>
                <div className="text-[#f1f3f6] text-lg font-bold">新增 Case</div>
                <div className="text-[#64748b] text-xs mt-1">
                  创建 Case 容器；WSI 可在创建时导入，也可后续进入 Case 详情继续添加。
                </div>
              </div>

              <button
                type="button"
                onClick={closeCreateModal}
                className="w-8 h-8 rounded-lg text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-white/[0.06] transition-all inline-flex items-center justify-center"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6 space-y-6">
              <div>
                <div className="text-[#f1f3f6] text-sm font-semibold mb-4">1. Case 基础信息</div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <FieldLabel required>Case 编号 / 样本编号</FieldLabel>
                    <input
                      value={newSampleId}
                      onChange={(event) => setNewSampleId(event.target.value)}
                      className="w-full h-10 rounded-md border border-white/[0.08] bg-[#17181d] px-3 text-sm text-[#e2e8f0] outline-none focus:border-[#8f35b7]"
                      placeholder="例如 S-20260520-7001"
                    />
                  </div>

                  <div>
                    <FieldLabel required>取材部位</FieldLabel>
                    <select
                      value={newSite}
                      onChange={(event) => setNewSite(event.target.value)}
                      className="w-full h-10 rounded-md border border-white/[0.08] bg-[#17181d] px-3 text-sm text-[#e2e8f0] outline-none focus:border-[#8f35b7]"
                    >
                      {siteOptions.map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <FieldLabel required>研究分类</FieldLabel>
                    <select
                      value={newCategory}
                      onChange={(event) => setNewCategory(event.target.value)}
                      className="w-full h-10 rounded-md border border-white/[0.08] bg-[#17181d] px-3 text-sm text-[#e2e8f0] outline-none focus:border-[#8f35b7]"
                    >
                      {categoryOptions.map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <FieldLabel>取材方式</FieldLabel>
                    <select
                      value={newSamplingMethod}
                      onChange={(event) => setNewSamplingMethod(event.target.value)}
                      className="w-full h-10 rounded-md border border-white/[0.08] bg-[#17181d] px-3 text-sm text-[#e2e8f0] outline-none focus:border-[#8f35b7]"
                    >
                      {samplingOptions.map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <FieldLabel>年龄段</FieldLabel>
                    <select
                      value={newAgeGroup}
                      onChange={(event) => setNewAgeGroup(event.target.value)}
                      className="w-full h-10 rounded-md border border-white/[0.08] bg-[#17181d] px-3 text-sm text-[#e2e8f0] outline-none focus:border-[#8f35b7]"
                    >
                      {ageGroupOptions.map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <FieldLabel>性别</FieldLabel>
                    <select
                      value={newSex}
                      onChange={(event) => setNewSex(event.target.value as CaseRow['sex'])}
                      className="w-full h-10 rounded-md border border-white/[0.08] bg-[#17181d] px-3 text-sm text-[#e2e8f0] outline-none focus:border-[#8f35b7]"
                    >
                      <option>未知</option>
                      <option>男</option>
                      <option>女</option>
                    </select>
                  </div>

                  <div className="col-span-3">
                    <FieldLabel>备注</FieldLabel>
                    <textarea
                      value={newRemark}
                      onChange={(event) => setNewRemark(event.target.value)}
                      className="w-full min-h-[72px] rounded-md border border-white/[0.08] bg-[#17181d] px-3 py-2 text-sm leading-6 text-[#e2e8f0] outline-none focus:border-[#8f35b7] resize-none"
                      placeholder="可填写研究用途、样本说明或其他备注。"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-white/[0.08] bg-[#17181d] overflow-hidden">
                <div className="h-14 px-4 border-b border-white/[0.06] flex items-center justify-between">
                  <div>
                    <div className="text-[#f1f3f6] text-sm font-semibold">2. WSI 导入，可选</div>
                    <div className="text-[#64748b] text-xs mt-0.5">
                      当前为模拟选择效果，不真实上传文件；不选择 WSI 也可以创建 Case。
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={addMockWsi}
                    className="h-8 px-3 rounded-md bg-[#8f35b7] text-white text-xs font-medium hover:bg-[#a64ed0] transition-all inline-flex items-center gap-1.5"
                  >
                    <Plus size={14} />
                    选择 WSI
                  </button>
                </div>

                <div className="p-4">
                  {selectedWsiList.length > 0 ? (
                    <div className="space-y-2">
                      {selectedWsiList.map((item) => (
                        <div
                          key={item.id}
                          className="h-12 rounded-lg border border-white/[0.08] bg-[#0f1014] px-3 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-md border border-white/[0.06] bg-[#202126] flex items-center justify-center shrink-0">
                              <FileText size={15} className="text-[#d292f4]" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-[#e2e8f0] text-sm font-mono truncate">{item.fileName}</div>
                              <div className="text-[#64748b] text-xs mt-0.5">
                                {item.stain} · {item.magnification} · {item.size}
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeWsi(item.id)}
                            className="w-8 h-8 rounded-md text-[#94a3b8] hover:text-[#f87171] hover:bg-white/[0.05] transition-all inline-flex items-center justify-center"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-[108px] rounded-lg border border-dashed border-white/[0.12] bg-[#0f1014] flex items-center justify-center text-center text-[#64748b] text-sm leading-6">
                      暂未选择 WSI
                      <br />
                      可直接创建空 Case，后续在 Case 详情中继续添加 WSI。
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-[#8f35b7]/25 bg-[#8f35b7]/10 p-4">
                <div className="text-[#d292f4] text-sm font-semibold mb-1">创建规则说明</div>
                <div className="text-[#94a3b8] text-xs leading-6">
                  创建时未导入 WSI，则 Case 状态为“待处理”；创建时已导入 WSI，则 Case 状态为“就绪”。WSI 数会根据已选择的 WSI 文件数量自动计算。
                </div>
              </div>
            </div>

            <div className="h-16 px-6 border-t border-white/[0.06] bg-[#17181d] flex items-center justify-between gap-3 shrink-0">
              <div className="text-[#64748b] text-xs">
                已选择 WSI：<span className="text-[#d292f4]">{selectedWsiList.length}</span> 张
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="h-9 px-4 rounded-md border border-white/[0.08] bg-[#202126] text-[#94a3b8] text-sm hover:text-[#e2e8f0] hover:bg-white/[0.04] transition-all"
                >
                  取消
                </button>

                <button
                  type="button"
                  onClick={createCase}
                  disabled={!newSampleId.trim() || !newSite.trim() || !newCategory.trim()}
                  className={`h-9 px-4 rounded-md text-sm font-medium transition-all ${
                    newSampleId.trim() && newSite.trim() && newCategory.trim()
                      ? 'bg-[#8f35b7] text-white hover:bg-[#a64ed0]'
                      : 'bg-white/[0.06] text-[#64748b] cursor-not-allowed'
                  }`}
                >
                  确定创建
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
