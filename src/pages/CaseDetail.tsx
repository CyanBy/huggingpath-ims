import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function CaseDetail() {
  const navigate = useNavigate();
  const { caseId } = useParams();

  return (
    <div className="min-h-[calc(100dvh-64px)] bg-[#0f1014] text-[#f1f3f6] px-8 py-8">
      <div className="max-w-[1200px] mx-auto">
        <button
          onClick={() => navigate('/cases')}
          className="h-9 px-4 rounded-md border border-white/[0.08] bg-[#202126] text-[#cbd5e1] hover:border-[#8f35b7] hover:text-white transition-colors inline-flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          返回病例库
        </button>

        <div className="mt-6 rounded-xl border border-white/[0.08] bg-[#202126] overflow-hidden">
          <div className="px-6 py-5 border-b border-white/[0.06]">
            <div className="text-2xl font-bold">病例详情</div>
            <div className="text-sm text-[#64748b] mt-2">
              当前仅展示跳转后的病例详情页面占位，具体详情设计后续再展开。
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="rounded-lg border border-white/[0.06] bg-[#17181d] p-4">
                <div className="text-xs text-[#64748b]">病理号</div>
                <div className="text-base font-semibold mt-2">{caseId}</div>
              </div>
              <div className="rounded-lg border border-white/[0.06] bg-[#17181d] p-4">
                <div className="text-xs text-[#64748b]">患者信息</div>
                <div className="text-base font-semibold mt-2">待设计</div>
              </div>
              <div className="rounded-lg border border-white/[0.06] bg-[#17181d] p-4">
                <div className="text-xs text-[#64748b]">切片信息</div>
                <div className="text-base font-semibold mt-2">待设计</div>
              </div>
              <div className="rounded-lg border border-white/[0.06] bg-[#17181d] p-4">
                <div className="text-xs text-[#64748b]">AI分析记录</div>
                <div className="text-base font-semibold mt-2">待设计</div>
              </div>
            </div>

            <div className="h-[420px] rounded-xl border border-dashed border-[#8f35b7]/50 bg-[#8f35b7]/10 flex items-center justify-center text-[#d292f4] text-base leading-8 text-center">
              病例详情页面占位
              <br />
              后续可在这里设计病例基本信息、患者信息、切片列表、AI分析记录等内容。
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}