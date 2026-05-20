import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
type CaseStatus = '就绪' | '处理中' | '异常';

type CaseRow = {
  sampleId: string;
  site: string;
  researchCategory: string;
  samplingMethod: string;
  ageGroup: string;
  sex: '男' | '女';
  wsiCount: number;
  status: CaseStatus;
  createdAt: string;
};

const cases: CaseRow[] = [
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

function SexBadge({ sex }: { sex: '男' | '女' }) {
  return (
    <span
      className={`h-6 min-w-6 px-2 rounded inline-flex items-center justify-center text-xs border ${
        sex === '女'
          ? 'border-[#8f2d5b] bg-[#8f2d5b]/20 text-[#f472b6]'
          : 'border-[#334155] bg-[#334155]/35 text-[#cbd5e1]'
      }`}
    >
      {sex}
    </span>
  );
}

function StatusBadge({ status }: { status: CaseStatus }) {
  const cls =
    status === '就绪'
      ? 'border-[#3f6212] bg-[#3f6212]/45 text-[#84cc16]'
      : status === '处理中'
        ? 'border-[#1d4ed8] bg-[#1d4ed8]/30 text-[#93c5fd]'
        : 'border-[#991b1b] bg-[#991b1b]/30 text-[#fca5a5]';

  return (
    <span className={`h-6 px-2 rounded inline-flex items-center text-xs border ${cls}`}>
      {status}
    </span>
  );
}

export default function WorkbenchCaseLibrary() {
  const navigate = useNavigate();
  const [project, setProject] = useState('按项目筛选');
  const [showDetail, setShowDetail] = useState(false);
  const [selectedCase, setSelectedCase] = useState<CaseRow | null>(null);

  const openDetail = (item: CaseRow) => {
    setSelectedCase(item);
    setShowDetail(true);
  };

  return (
    <div className="min-h-[calc(100dvh-64px)] bg-[#0f1014] text-[#e5e7eb] px-4 pt-3 pb-6">
      {!showDetail ? (
        <>
          <div className="mb-4">
            <h1 className="text-[24px] leading-8 font-bold text-[#f8fafc]">Case 管理</h1>
            <p className="text-sm text-[#64748b] mt-1">所有样本均已去标识化，遵循科研伦理规范</p>
          </div>

         <div className="rounded-md border border-white/[0.08] bg-[#202126] px-4 pt-4 pb-5">
            <div className="flex items-center gap-2 mb-4">
             <div className="h-9 w-[210px] rounded-md border border-white/[0.08] bg-[#17181d] px-3 flex items-center gap-2">
                <span className="text-[#94a3b8] text-sm">⌕</span>
                <input
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
                  {cases.map((item) => (
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
        </>
      ) : (
        <div className="rounded-md border border-white/[0.08] bg-[#202126] p-5 min-h-[640px]">
          <div className="flex items-start justify-between border-b border-[#1f2a44] pb-4 mb-5">
            <div>
              <h1 className="text-[24px] leading-8 font-bold text-[#f8fafc]">Case 详情</h1>
              <p className="text-sm text-[#64748b] mt-1">
                当前 Case：{selectedCase?.sampleId}
              </p>
            </div>

            <button
              onClick={() => setShowDetail(false)}
              className="h-9 px-4 rounded-md border border-[#26314f] bg-[#151a2e] text-[#cbd5e1] text-sm hover:bg-white/[0.04]"
            >
              返回列表
            </button>
          </div>

          <div className="h-[480px] rounded-md border border-dashed border-[#3b82f6]/45 bg-[#3b82f6]/5 flex items-center justify-center text-center text-[#93c5fd] leading-8">
            Case 下的切片列表及 AI 分析占位
            <br />
            后续在这里展示该 Case 绑定的 WSI 切片、缩略图、AI 状态和切片操作。
          </div>
        </div>
      )}
    </div>
  );
}