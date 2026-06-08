import { useState } from 'react';
import { FileImage, Plus, Search, UploadCloud } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type WsiStatus = '已上传' | '待绑定' | '异常';

type WsiRow = {
  id: string;
  fileName: string;
  format: string;
  size: string;
  stain: string;
  magnification: string;
  boundCase: string;
  status: WsiStatus;
  uploadedAt: string;
};

const initialWsiRows: WsiRow[] = [
  {
    id: 'wsi-001',
    fileName: 'S-20260517-1906_HE_001.svs',
    format: 'SVS',
    size: '1.4 GB',
    stain: 'HE',
    magnification: '40X',
    boundCase: 'S-20260517-1906',
    status: '已上传',
    uploadedAt: '2026-05-20',
  },
  {
    id: 'wsi-002',
    fileName: 'S-20260517-1906_IHC_HER2_001.sdpc',
    format: 'SDPC',
    size: '856 MB',
    stain: 'IHC',
    magnification: '40X',
    boundCase: 'S-20260517-1906',
    status: '已上传',
    uploadedAt: '2026-05-20',
  },
  {
    id: 'wsi-003',
    fileName: 'Temporary_AI_Slide_001.svs',
    format: 'SVS',
    size: '1.1 GB',
    stain: 'HE',
    magnification: '20X',
    boundCase: '未绑定',
    status: '待绑定',
    uploadedAt: '2026-05-19',
  },
  {
    id: 'wsi-004',
    fileName: 'kidney_pas_002.tiff',
    format: 'TIFF',
    size: '620 MB',
    stain: 'PAS',
    magnification: '40X',
    boundCase: 'S-20260209-6099',
    status: '已上传',
    uploadedAt: '2026-05-18',
  },
];

export default function WorkbenchWsiManagement() {
  const navigate = useNavigate();

  const [keyword, setKeyword] = useState('');
  const [wsiRows, setWsiRows] = useState<WsiRow[]>(initialWsiRows);

  const filteredRows = wsiRows.filter((item) => {
    if (!keyword.trim()) return true;

    const text = `${item.fileName} ${item.format} ${item.stain} ${item.boundCase}`.toLowerCase();
    return text.includes(keyword.trim().toLowerCase());
  });

  const addMockWsi = () => {
    const nextIndex = wsiRows.length + 1;

    const newWsi: WsiRow = {
      id: `wsi-${Date.now()}`,
      fileName: `New_WSI_${String(nextIndex).padStart(3, '0')}.svs`,
      format: 'SVS',
      size: '1.2 GB',
      stain: 'HE',
      magnification: '40X',
      boundCase: '未绑定',
      status: '待绑定',
      uploadedAt: '2026-05-20',
    };

    setWsiRows((prev) => [newWsi, ...prev]);
  };

  const addWsiToAnalysis = (item: WsiRow) => {
    localStorage.setItem(
      'pendingWorkbenchAnalysisSlide',
      JSON.stringify({
        id: item.id,
        fileName: item.fileName,
        size: item.size,
        stain: item.stain,
        magnification: item.magnification,
        boundCase: item.boundCase,
      }),
    );

    navigate('/workbench');
  };

  const deleteWsi = (id: string) => {
    setWsiRows((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="min-h-[calc(100dvh-64px)] bg-[#0f1014] text-[#f1f3f6] px-6 py-5">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[26px] leading-8 font-bold">WSI 管理</h1>
          <p className="text-sm text-[#64748b] mt-1">
            用于集中管理已上传的 WSI 文件，可后续绑定到 Case 或用于分析任务。
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="h-9 w-[260px] rounded-md border border-white/[0.08] bg-[#17181d] px-3 flex items-center gap-2">
            <Search size={15} className="text-[#64748b]" />
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              className="w-full bg-transparent outline-none text-sm text-[#cbd5e1] placeholder:text-[#64748b]"
              placeholder="搜索 WSI 文件 / Case"
            />
          </div>

          <button
            type="button"
            onClick={addMockWsi}
            className="h-9 px-4 rounded-md bg-[#8f35b7] text-white text-sm font-medium hover:bg-[#a64ed0] transition-all inline-flex items-center gap-2"
          >
            <Plus size={16} />
            上传 WSI
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-5">
        <div className="rounded-xl border border-white/[0.08] bg-[#202126] p-4">
          <div className="text-[#64748b] text-sm mb-3">WSI 总数</div>
          <div className="flex items-center gap-2 text-[#f1f3f6] text-2xl font-bold">
            <FileImage size={24} className="text-[#d292f4]" />
            {wsiRows.length}
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-[#202126] p-4">
          <div className="text-[#64748b] text-sm mb-3">已绑定 Case</div>
          <div className="text-[#f1f3f6] text-2xl font-bold">
            {wsiRows.filter((item) => item.boundCase !== '未绑定').length}
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-[#202126] p-4">
          <div className="text-[#64748b] text-sm mb-3">待绑定</div>
          <div className="text-[#f1f3f6] text-2xl font-bold">
            {wsiRows.filter((item) => item.status === '待绑定').length}
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-[#202126] p-4">
          <div className="text-[#64748b] text-sm mb-3">模拟存储占用</div>
          <div className="text-[#f1f3f6] text-2xl font-bold">4.1 GB</div>
        </div>
      </div>

      <div className="rounded-xl border border-white/[0.08] bg-[#202126] overflow-hidden">
        <div className="h-14 px-4 border-b border-white/[0.06] flex items-center justify-between">
          <div>
            <div className="text-[#f1f3f6] text-base font-semibold">WSI 文件列表</div>
            <div className="text-[#64748b] text-xs mt-0.5">
              当前为前端模拟数据，后续可接入真实上传、解析、绑定 Case 与删除流程。
            </div>
          </div>

          <button
            type="button"
            className="h-8 px-3 rounded-md border border-[#8f35b7]/35 bg-[#8f35b7]/10 text-[#d292f4] text-xs font-medium hover:bg-[#8f35b7]/18 transition-all inline-flex items-center gap-1.5"
          >
            <UploadCloud size={14} />
            批量导入
          </button>
        </div>

        <table className="w-full table-fixed border-collapse text-sm">
          <thead>
            <tr className="bg-[#252730] text-[#cbd5e1]">
              <th className="h-11 px-3 text-left font-semibold" style={{ width: '22%' }}>
                文件名
              </th>
              <th className="h-11 px-3 text-left font-semibold" style={{ width: '7%' }}>
                格式
              </th>
              <th className="h-11 px-3 text-left font-semibold" style={{ width: '9%' }}>
                文件大小
              </th>
              <th className="h-11 px-3 text-left font-semibold" style={{ width: '8%' }}>
                染色
              </th>
              <th className="h-11 px-3 text-left font-semibold" style={{ width: '8%' }}>
                倍率
              </th>
              <th className="h-11 px-3 text-left font-semibold" style={{ width: '20%' }}>
                绑定 Case
              </th>
              <th className="h-11 px-3 text-left font-semibold" style={{ width: '23%' }}>
                操作
              </th>
            </tr>
          </thead>

          <tbody>
            {filteredRows.map((item) => (
              <tr
                key={item.id}
                className="border-b border-white/[0.06] text-[#d1d5db] hover:bg-white/[0.025]"
              >
                <td className="h-11 px-3 font-mono text-[#e5e7eb] truncate">{item.fileName}</td>
                <td className="h-11 px-3">{item.format}</td>
                <td className="h-11 px-3">{item.size}</td>
                <td className="h-11 px-3">{item.stain}</td>
                <td className="h-11 px-3">{item.magnification}</td>
                <td className="h-11 px-3">{item.boundCase}</td>
                <td className="h-11 px-3">
                  <div className="flex items-center gap-4 whitespace-nowrap">
                    <button
                      type="button"
                      className="text-[#d292f4] hover:text-[#f0b7ff] text-sm"
                    >
                      查看
                    </button>

                    <button
                      type="button"
                      onClick={() => addWsiToAnalysis(item)}
                      className="text-[#d292f4] hover:text-[#f0b7ff] text-sm"
                    >
                      加入分析
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteWsi(item.id)}
                      className="text-[#ff9c9c] hover:text-[#fecaca] text-sm"
                    >
                      删除
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {filteredRows.length === 0 && (
              <tr>
                <td colSpan={7} className="h-24 text-center text-[#64748b]">
                  暂无匹配的 WSI 文件
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
