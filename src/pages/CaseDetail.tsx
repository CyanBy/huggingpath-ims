import { useState } from 'react';
import { FileText, Plus } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

type WsiStatus = '已上传' | '待分析' | '分析完成' | '分析异常';

type CaseWsiRow = {
  id: string;
  name: string;
  stain: string;
  magnification: string;
  fileSize: string;
  aiStatus: WsiStatus;
  createdAt: string;
};

const initialWsiRows: CaseWsiRow[] = [
  {
    id: 'wsi-001',
    name: 'S-20260517-1906_HE_001.svs',
    stain: 'HE',
    magnification: '40X',
    fileSize: '1.24 GB',
    aiStatus: '分析完成',
    createdAt: '2026-05-17',
  },
  {
    id: 'wsi-002',
    name: 'S-20260517-1906_IHC_Ki67_001.svs',
    stain: 'Ki67',
    magnification: '40X',
    fileSize: '982 MB',
    aiStatus: '待分析',
    createdAt: '2026-05-17',
  },
  {
    id: 'wsi-003',
    name: 'S-20260517-1906_PAS_001.svs',
    stain: 'PAS',
    magnification: '20X',
    fileSize: '756 MB',
    aiStatus: '已上传',
    createdAt: '2026-05-18',
  },
];

function StatusBadge({ status }: { status: WsiStatus }) {
  const className =
    status === '分析完成'
      ? 'border-[#3f6212] bg-[#3f6212]/35 text-[#84cc16]'
      : status === '待分析'
        ? 'border-[#8f35b7]/40 bg-[#8f35b7]/20 text-[#d292f4]'
        : status === '分析异常'
          ? 'border-[#991b1b] bg-[#991b1b]/30 text-[#fca5a5]'
          : 'border-white/[0.08] bg-white/[0.05] text-[#94a3b8]';

  return (
    <span className={`h-6 px-2 rounded text-xs border inline-flex items-center ${className}`}>
      {status}
    </span>
  );
}

export default function CaseDetail() {
  const navigate = useNavigate();
  const { caseId } = useParams();

  const [wsiRows, setWsiRows] = useState<CaseWsiRow[]>(initialWsiRows);

  const currentCaseId = caseId || 'S-20260517-1906';

  const addWsi = () => {
    const nextIndex = wsiRows.length + 1;

    const newWsi: CaseWsiRow = {
      id: `wsi-${Date.now()}`,
      name: `${currentCaseId}_NEW_${String(nextIndex).padStart(3, '0')}.svs`,
      stain: 'HE',
      magnification: '40X',
      fileSize: '待识别',
      aiStatus: '已上传',
      createdAt: '2026-05-20',
    };

    setWsiRows((prev) => [newWsi, ...prev]);
  };

  return (
    <div className="min-h-[calc(100dvh-64px)] bg-[#0f1014] text-[#f1f3f6] px-6 py-5">
      <div className="rounded-xl border border-white/[0.08] bg-[#202126] p-6">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h1 className="text-[28px] leading-9 font-bold text-[#f8fafc]">Case 详情</h1>
            <p className="text-sm text-[#64748b] mt-2">
              当前 Case：<span className="text-[#94a3b8] font-mono">{currentCaseId}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/workbench/cases')}
            className="h-10 px-4 rounded-lg border border-[#8f35b7]/35 bg-[#8f35b7]/10 text-[#d292f4] text-sm hover:bg-[#8f35b7]/18 transition-all"
          >
            返回列表
          </button>
        </div>

        <div className="border-t border-white/[0.06] pt-5">
          <div className="grid grid-cols-4 gap-4 mb-5">
            <div className="rounded-xl border border-white/[0.08] bg-[#17181d] p-4">
              <div className="text-[#64748b] text-sm mb-2">Case 编号</div>
              <div className="text-[#e2e8f0] text-base font-mono">{currentCaseId}</div>
            </div>

            <div className="rounded-xl border border-white/[0.08] bg-[#17181d] p-4">
              <div className="text-[#64748b] text-sm mb-2">WSI 数</div>
              <div className="text-[#e2e8f0] text-2xl font-bold">{wsiRows.length}</div>
            </div>

            <div className="rounded-xl border border-white/[0.08] bg-[#17181d] p-4">
              <div className="text-[#64748b] text-sm mb-2">取材部位</div>
              <div className="text-[#e2e8f0] text-base">lung</div>
            </div>

            <div className="rounded-xl border border-white/[0.08] bg-[#17181d] p-4">
              <div className="text-[#64748b] text-sm mb-2">研究分类</div>
              <div className="text-[#e2e8f0] text-base">炎性病变</div>
            </div>
          </div>

          <div className="rounded-xl border border-white/[0.08] bg-[#17181d] overflow-hidden">
            <div className="h-14 px-4 border-b border-white/[0.06] flex items-center justify-between">
              <div>
                <div className="text-[#f1f3f6] text-base font-semibold">Case 下的 WSI 切片列表</div>
                <div className="text-[#64748b] text-xs mt-0.5">
                  展示该 Case 绑定的 WSI 切片、染色类型、AI 状态和切片操作。
                </div>
              </div>

              <button
                type="button"
                onClick={addWsi}
                className="h-8 px-3 rounded-md bg-[#8f35b7] text-white text-xs font-medium hover:bg-[#a64ed0] transition-all inline-flex items-center gap-1.5"
              >
                <Plus size={14} />
                添加 WSI
              </button>
            </div>

            <table className="w-full table-fixed border-collapse text-sm">
              <thead>
                <tr className="bg-[#252730] text-[#cbd5e1]">
                  <th className="h-11 px-3 text-left font-semibold" style={{ width: '28%' }}>WSI 名称</th>
                  <th className="h-11 px-3 text-left font-semibold" style={{ width: '12%' }}>染色</th>
                  <th className="h-11 px-3 text-left font-semibold" style={{ width: '12%' }}>倍率</th>
                  <th className="h-11 px-3 text-left font-semibold" style={{ width: '12%' }}>文件大小</th>
                  <th className="h-11 px-3 text-left font-semibold" style={{ width: '14%' }}>AI 状态</th>
                  <th className="h-11 px-3 text-left font-semibold" style={{ width: '12%' }}>创建时间</th>
                  <th className="h-11 px-3 text-left font-semibold" style={{ width: '10%' }}>操作</th>
                </tr>
              </thead>

              <tbody>
                {wsiRows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-white/[0.06] text-[#d1d5db] hover:bg-white/[0.025]"
                  >
                    <td className="h-12 px-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-md bg-[#202126] border border-white/[0.06] flex items-center justify-center shrink-0">
                          <FileText size={16} className="text-[#d292f4]" />
                        </div>
                        <span className="font-mono text-[#e5e7eb] truncate">{row.name}</span>
                      </div>
                    </td>
                    <td className="h-12 px-3">{row.stain}</td>
                    <td className="h-12 px-3">{row.magnification}</td>
                    <td className="h-12 px-3">{row.fileSize}</td>
                    <td className="h-12 px-3">
                      <StatusBadge status={row.aiStatus} />
                    </td>
                    <td className="h-12 px-3">{row.createdAt}</td>
                    <td className="h-12 px-3">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          className="text-[#d292f4] hover:text-[#f0b7ff] text-sm"
                        >
                          查看
                        </button>
                        <button
                          type="button"
                          className="text-[#94a3b8] hover:text-[#e2e8f0] text-sm"
                        >
                          分析
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {wsiRows.length === 0 && (
              <div className="h-[260px] flex items-center justify-center text-center text-[#64748b]">
                当前 Case 下暂无 WSI 切片。
                <br />
                点击“添加 WSI”创建一条测试数据。
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}