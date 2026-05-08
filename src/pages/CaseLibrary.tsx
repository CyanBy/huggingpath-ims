import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

type AiStatus = '未分析' | '分析中' | '分析完成' | '分析失败';

type CaseRow = {
  caseId: string;
  desc: string;
  patient: string;
  patientMeta: string;
  part: string;
  type: string;
  slides: number;
  aiStatus: AiStatus;
  createdAt: string;
  deletable?: boolean;
};

const initialCases: CaseRow[] = [
  {
    caseId: '25AH032093',
    desc: '门诊 · 胃活检',
    patient: '患者A',
    patientMeta: '男 · 58岁',
    part: '胃',
    type: '活检',
    slides: 3,
    aiStatus: '分析完成',
    createdAt: '04-28',
    deletable: true,
  },
  {
    caseId: '25BR018762',
    desc: '住院 · 乳腺穿刺',
    patient: '患者B',
    patientMeta: '女 · 46岁',
    part: '乳腺',
    type: '活检',
    slides: 1,
    aiStatus: '未分析',
    createdAt: '04-27',
  },
  {
    caseId: '25CX009871',
    desc: '宫颈TCT',
    patient: '患者C',
    patientMeta: '女 · 39岁',
    part: '宫颈',
    type: '细胞学',
    slides: 1,
    aiStatus: '分析中',
    createdAt: '04-26',
  },
  {
    caseId: '25PR004356',
    desc: '前列腺穿刺',
    patient: '患者D',
    patientMeta: '男 · 67岁',
    part: '前列腺',
    type: '活检',
    slides: 0,
    aiStatus: '未分析',
    createdAt: '04-25',
    deletable: true,
  },
  {
    caseId: '25LG010882',
    desc: '肺穿刺',
    patient: '患者E',
    patientMeta: '男 · 61岁',
    part: '肺',
    type: '活检',
    slides: 2,
    aiStatus: '分析失败',
    createdAt: '04-24',
  },
];

const partOptions = ['部位：全部', '部位：胃', '部位：乳腺', '部位：宫颈', '部位：前列腺', '部位：肺', '部位：肠道'];
const typeOptions = ['类型：全部', '类型：活检', '类型：手术', '类型：细胞学', '类型：免疫组化'];
const aiOptions = ['AI状态：全部', 'AI状态：未分析', 'AI状态：分析中', 'AI状态：分析完成', 'AI状态：分析失败'];

function StatusBadge({ status }: { status: AiStatus }) {
  const cls =
    status === '分析完成'
      ? 'bg-[#35c96d]/15 text-[#83e5a8]'
      : status === '分析中'
        ? 'bg-[#5d8eff]/15 text-[#9db8ff]'
        : status === '分析失败'
          ? 'bg-[#ef5b5b]/15 text-[#ff9c9c]'
          : 'bg-slate-400/15 text-[#aeb5c1]';

  return (
    <span className={`h-6 px-2.5 rounded-full inline-flex items-center text-xs font-bold ${cls}`}>
      {status}
    </span>
  );
}

function PurpleBadge({ children }: { children: string }) {
  return (
    <span className="h-6 px-2.5 rounded-full inline-flex items-center text-xs font-bold bg-[#8f35b7]/20 text-[#d292f4]">
      {children}
    </span>
  );
}

function SelectBox({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={`relative h-[38px] w-[170px] shrink-0 rounded-md border bg-[#17181d] px-3 text-sm flex items-center justify-between cursor-pointer select-none ${
        open ? 'border-[#8f35b7] shadow-[0_0_0_3px_rgba(143,53,183,0.18)]' : 'border-white/[0.08]'
      }`}
      onClick={() => setOpen(!open)}
    >
      <span className="text-[#9aa0aa]">{value}</span>
      <span className="text-[#64748b]">⌄</span>

      {open && (
        <div className="absolute left-0 right-0 top-[42px] z-30 rounded-lg border border-white/[0.08] bg-[#202126] p-1.5 shadow-[0_12px_36px_rgba(0,0,0,0.34)]">
          {options.map((item) => (
            <div
              key={item}
              className={`h-8 rounded-md px-2.5 flex items-center text-sm ${
                item === value
                  ? 'bg-[#8f35b7]/20 text-white'
                  : 'text-[#cbd5e1] hover:bg-white/[0.05]'
              }`}
              onClick={(event) => {
                event.stopPropagation();
                onChange(item);
                setOpen(false);
              }}
            >
              {item}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CaseLibrary() {
  const navigate = useNavigate();
  const [cases, setCases] = useState<CaseRow[]>(initialCases);
  const [part, setPart] = useState('部位：全部');
  const [type, setType] = useState('类型：全部');
  const [aiStatus, setAiStatus] = useState('AI状态：全部');

  const openCaseDetail = (caseId: string) => {
    navigate(`/cases/${caseId}`);
  };

  const viewWorkbench = (caseId: string) => {
    navigate(`/workbench?caseId=${caseId}`);
  };

  const joinWorkbench = (caseId: string) => {
    const existed = JSON.parse(localStorage.getItem('joinedWorkbenchCases') || '[]') as string[];
    const next = Array.from(new Set([...existed, caseId]));
    localStorage.setItem('joinedWorkbenchCases', JSON.stringify(next));

    setCases((prev) =>
      prev.map((item) =>
        item.caseId === caseId
          ? {
              ...item,
              aiStatus: '分析中',
            }
          : item,
      ),
    );

    navigate(`/workbench?caseId=${caseId}`);
  };

  return (
    <div className="min-h-[calc(100dvh-64px)] bg-[#0f1014] text-[#f1f3f6]">
      <div className="grid grid-cols-[300px_1fr] min-h-[calc(100dvh-64px)]">
        <aside className="bg-[#17181d] border-r border-white/[0.06] p-5 overflow-auto">
          <div className="text-lg font-extrabold mb-4">病例筛选</div>

          <div className="mb-6">
            <div className="text-xs text-[#9aa0aa] mb-2.5">部位</div>
            <div className="grid gap-1.5">
              {[
                ['全部部位', '128', true],
                ['胃', '32', false],
                ['乳腺', '21', false],
                ['宫颈', '26', false],
                ['前列腺', '16', false],
                ['肺', '18', false],
                ['肠道', '15', false],
              ].map(([label, count, active]) => (
                <div
                  key={label as string}
                  className={`h-9 rounded-md px-2.5 flex items-center justify-between text-sm ${
                    active
                      ? 'bg-[#8f35b7]/20 text-white font-bold'
                      : 'text-[#cbd5e1] hover:bg-white/[0.05]'
                  }`}
                >
                  <span>{label}</span>
                  <span
                    className={`min-w-6 h-[22px] px-2 rounded-full inline-flex items-center justify-center text-xs ${
                      active ? 'bg-[#8f35b7] text-white' : 'bg-[#252730] text-[#9aa0aa]'
                    }`}
                  >
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <div className="text-xs text-[#9aa0aa] mb-2.5">病例状态</div>
            <div className="grid gap-1.5">
              {[
                ['待上传切片', '13'],
                ['待分析', '37'],
                ['分析中', '6'],
                ['分析完成', '68'],
                ['分析失败', '4'],
              ].map(([label, count]) => (
                <div
                  key={label}
                  className="h-9 rounded-md px-2.5 flex items-center justify-between text-sm text-[#cbd5e1] hover:bg-white/[0.05]"
                >
                  <span>{label}</span>
                  <span className="min-w-6 h-[22px] px-2 rounded-full inline-flex items-center justify-center text-xs bg-[#252730] text-[#9aa0aa]">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs text-[#9aa0aa] mb-2.5">病理类型</div>
            <div className="grid gap-1.5">
              {[
                ['活检', '74'],
                ['手术', '31'],
                ['细胞学', '18'],
                ['免疫组化', '5'],
              ].map(([label, count]) => (
                <div
                  key={label}
                  className="h-9 rounded-md px-2.5 flex items-center justify-between text-sm text-[#cbd5e1] hover:bg-white/[0.05]"
                >
                  <span>{label}</span>
                  <span className="min-w-6 h-[22px] px-2 rounded-full inline-flex items-center justify-center text-xs bg-[#252730] text-[#9aa0aa]">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <section className="min-w-0 overflow-auto p-6 bg-[radial-gradient(circle_at_78%_10%,rgba(143,53,183,0.12),transparent_34%),#0f1014]">
          <div className="mb-5">
            <h1 className="text-[26px] font-bold mb-2">病例库</h1>
            <p className="text-sm leading-relaxed text-[#9aa0aa]">
              以病例为主对象管理患者信息、部位、病理类型、切片与 AI 分析状态；工作台可从病例库选择病例加入当前分析队列。
            </p>
          </div>

          <div className="grid grid-cols-5 gap-3 mb-5">
            <div className="rounded-xl border border-white/[0.08] bg-[#202126] p-4">
              <div className="text-xs text-[#9aa0aa] mb-2">总病例</div>
              <div className="text-2xl font-extrabold">128</div>
              <div className="text-xs text-[#64748b] mt-1">按病例号聚合</div>
            </div>
            <div className="rounded-xl border border-white/[0.08] bg-[#202126] p-4">
              <div className="text-xs text-[#9aa0aa] mb-2">切片总数</div>
              <div className="text-2xl font-extrabold">386</div>
              <div className="text-xs text-[#64748b] mt-1">已上传 342 / 待上传 44</div>
            </div>
            <div className="rounded-xl border border-white/[0.08] bg-[#202126] p-4">
              <div className="text-xs text-[#9aa0aa] mb-2">待分析</div>
              <div className="text-2xl font-extrabold">37</div>
              <div className="text-xs text-[#64748b] mt-1">可加入工作台</div>
            </div>
            <div className="rounded-xl border border-white/[0.08] bg-[#202126] p-4">
              <div className="text-xs text-[#9aa0aa] mb-2">分析完成</div>
              <div className="text-2xl font-extrabold">68</div>
              <div className="text-xs text-[#64748b] mt-1">含 AI 结果</div>
            </div>
            <div className="rounded-xl border border-white/[0.08] bg-[#202126] p-4">
              <div className="text-xs text-[#9aa0aa] mb-2">分析失败</div>
              <div className="text-2xl font-extrabold">4</div>
              <div className="text-xs text-[#64748b] mt-1">需重试或换 AI</div>
            </div>
          </div>

          <div className="rounded-xl border border-white/[0.08] bg-[#202126] overflow-hidden">
            <div className="h-[58px] border-b border-white/[0.06] px-4 flex items-center justify-between">
              <div className="flex items-baseline gap-2.5">
                <div className="text-lg font-extrabold">病例列表</div>
                <div className="text-xs text-[#64748b]">当前筛选：全部部位 / 全部状态 / 全部类型</div>
              </div>
              <button className="h-[38px] px-4 rounded-md bg-[#8f35b7] text-white text-sm font-medium">
                ＋ 新增病例
              </button>
            </div>

            <div className="p-4 border-b border-white/[0.06] flex items-center gap-2.5">
              <div className="w-[300px] h-[38px] shrink-0 rounded-md border border-white/[0.08] bg-[#17181d] px-3 flex items-center text-sm text-[#9aa0aa]">
                请输入病理号 / 患者姓名 / Slide ID
              </div>

              <SelectBox value={part} options={partOptions} onChange={setPart} />
              <SelectBox value={type} options={typeOptions} onChange={setType} />
              <SelectBox value={aiStatus} options={aiOptions} onChange={setAiStatus} />

              <div className="flex-1" />

              <button className="w-[92px] h-[38px] shrink-0 rounded-md bg-[#8f35b7] text-white text-sm font-medium">
                查询
              </button>
            </div>

            <div className="px-4 pb-4 flex gap-2">
              <div className="h-[34px] px-3.5 rounded-md bg-[#8f35b7] border border-[#8f35b7] text-white text-sm font-bold flex items-center">
                全部病例 128
              </div>
              <div className="h-[34px] px-3.5 rounded-md bg-[#202126] border border-white/[0.08] text-[#9aa0aa] text-sm flex items-center">
                已完成分析 68
              </div>
              <div className="h-[34px] px-3.5 rounded-md bg-[#202126] border border-white/[0.08] text-[#9aa0aa] text-sm flex items-center">
                分析异常 10
              </div>
            </div>

            <table className="w-full table-fixed border-collapse text-sm">
              <thead>
                <tr className="bg-[#252730] text-[#aeb5c1]">
                  <th className="h-12 px-3.5 text-left font-bold" style={{ width: '15%' }}>病理号</th>
                  <th className="h-12 px-3.5 text-left font-bold" style={{ width: '16%' }}>患者信息</th>
                  <th className="h-12 px-3.5 text-left font-bold" style={{ width: '11%' }}>部位</th>
                  <th className="h-12 px-3.5 text-left font-bold" style={{ width: '11%' }}>病理类型</th>
                  <th className="h-12 px-3.5 text-left font-bold" style={{ width: '11%' }}>切片</th>
                  <th className="h-12 px-3.5 text-left font-bold" style={{ width: '13%' }}>AI状态</th>
                  <th className="h-12 px-3.5 text-left font-bold" style={{ width: '10%' }}>创建时间</th>
                  <th className="h-12 px-3.5 text-left font-bold" style={{ width: '13%' }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {cases.map((item) => {
                  const showWorkbench = item.aiStatus === '分析中' || item.aiStatus === '分析完成' || item.aiStatus === '分析失败';
                  const showJoin = item.aiStatus === '未分析';

                  return (
                    <tr key={item.caseId} className="border-b border-white/[0.06] hover:bg-white/[0.025]">
                      <td className="h-[58px] px-3.5">
                        <div className="font-bold text-white">{item.caseId}</div>
                        <div className="text-xs text-[#64748b] mt-1">{item.desc}</div>
                      </td>
                      <td className="h-[58px] px-3.5">
                        <div className="font-semibold text-[#e2e8f0]">{item.patient}</div>
                        <div className="text-xs text-[#64748b] mt-1">{item.patientMeta}</div>
                      </td>
                      <td className="h-[58px] px-3.5">
                        <PurpleBadge>{item.part}</PurpleBadge>
                      </td>
                      <td className="h-[58px] px-3.5 text-[#d7dce5]">{item.type}</td>
                      <td className="h-[58px] px-3.5 text-[#d7dce5]">{item.slides} 张</td>
                      <td className="h-[58px] px-3.5">
                        <StatusBadge status={item.aiStatus} />
                      </td>
                      <td className="h-[58px] px-3.5 text-[#d7dce5]">{item.createdAt}</td>
                      <td className="h-[58px] px-3.5">
                        <div className="flex gap-3 text-[#d292f4] text-sm whitespace-nowrap">
                          <button onClick={() => openCaseDetail(item.caseId)}>查看</button>
                          {showJoin && <button onClick={() => joinWorkbench(item.caseId)}>加入工作台</button>}
                          {showWorkbench && <button onClick={() => viewWorkbench(item.caseId)}>查看工作台</button>}
                          {item.deletable && <button className="text-[#ff8f8f]">删除</button>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}