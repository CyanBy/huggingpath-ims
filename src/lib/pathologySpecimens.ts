export type PathologySpecimenProfile = {
  site: string;
  samplingMethod: string;
};

export const PATHOLOGY_SITE_OPTIONS = [
  { value: 'lung', label: '肺' },
  { value: 'kidney', label: '肾' },
  { value: 'thyroid', label: '甲状腺' },
  { value: 'stomach', label: '胃' },
  { value: 'colon', label: '结直肠' },
  { value: 'liver', label: '肝' },
  { value: 'breast', label: '乳腺' },
  { value: 'cervix', label: '宫颈' },
] as const;

export const SAMPLING_METHOD_OPTIONS = [
  { value: 'biopsy', label: '活检' },
  { value: 'surgical', label: '手术切除' },
  { value: 'cytology', label: '细胞学取材' },
  { value: 'curettage', label: '刮取 / 搔刮' },
  { value: 'other', label: '其他' },
] as const;

const CASE_SPECIMEN_PROFILES: Record<string, PathologySpecimenProfile> = {
  'S-20260517-1906': { site: 'lung', samplingMethod: 'biopsy' },
  'S-20260209-6099': { site: 'kidney', samplingMethod: 'surgical' },
  'S-20260114-3036': { site: 'colon', samplingMethod: 'surgical' },
  'S-20260402-9407': { site: 'breast', samplingMethod: 'biopsy' },
  'S-20251122-5123': { site: 'stomach', samplingMethod: 'biopsy' },
  'S-20260427-6800': { site: 'liver', samplingMethod: 'surgical' },
  'S-20251129-0750': { site: 'kidney', samplingMethod: 'surgical' },
  'S-20260515-4367': { site: 'thyroid', samplingMethod: 'biopsy' },
  'S-20260129-6047': { site: 'stomach', samplingMethod: 'biopsy' },
  'S-20260504-9169': { site: 'kidney', samplingMethod: 'surgical' },
  'S-20251207-7468': { site: 'lung', samplingMethod: 'biopsy' },
  'S-20260126-4765': { site: 'colon', samplingMethod: 'surgical' },
  'S-20251221-0796': { site: 'liver', samplingMethod: 'biopsy' },
  'S-20260107-6890': { site: 'colon', samplingMethod: 'surgical' },
  'S-20251123-6531': { site: 'breast', samplingMethod: 'surgical' },
  'S-20260602-0008': { site: 'stomach', samplingMethod: 'biopsy' },
};

function normalizeSite(value: string) {
  return value === 'gastric' ? 'stomach' : value;
}

export function getPathologySiteLabel(value: string) {
  const normalizedValue = normalizeSite(value);
  return PATHOLOGY_SITE_OPTIONS.find((item) => item.value === normalizedValue)?.label || value;
}

export function getSamplingMethodLabel(value: string) {
  return SAMPLING_METHOD_OPTIONS.find((item) => item.value === value)?.label || value;
}

export function getCaseSpecimenProfile(caseId: string) {
  return CASE_SPECIMEN_PROFILES[caseId];
}
