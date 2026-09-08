<script setup lang="ts">
import { ref } from 'vue'
import { X } from '@lucide/vue'
import { PATHOLOGY_SITE_OPTIONS, SAMPLING_METHOD_OPTIONS } from '@/lib/pathologySpecimens'
import { createWorkspaceCase, type WorkspaceCase } from '../data/pathologyWorkspace'

const emit = defineEmits<{ close: []; saved: [value: WorkspaceCase] }>()
const form = ref<WorkspaceCase>({
  id: '',
  patientCode: '',
  site: '',
  samplingMethod: '',
  age: null,
  sex: '未知',
  diagnosis: '',
  department: '',
  receivedAt: new Date().toISOString().slice(0, 10),
  priority: '常规',
  status: '待处理',
  remark: '',
})
const error = ref('')

function save() {
  error.value = ''
  const value = {
    ...form.value,
    id: form.value.id.trim(),
    patientCode: form.value.patientCode.trim(),
    diagnosis: form.value.diagnosis.trim(),
    department: form.value.department.trim(),
    remark: form.value.remark.trim(),
  }
  if (!value.id || !value.patientCode || !value.site || !value.samplingMethod || !value.diagnosis || !value.receivedAt) {
    error.value = '请补全所有标记为必填的病例信息。'
    return
  }
  if (value.age !== null && (value.age < 0 || value.age > 130)) {
    error.value = '年龄需填写 0–130 之间的数字。'
    return
  }
  try {
    createWorkspaceCase(value)
    emit('saved', value)
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : '创建 Case 失败。'
  }
}
</script>

<template>
  <div class="fixed inset-0 z-[150] flex items-start justify-center overflow-y-auto bg-black/75 px-4 py-4" @click.self="emit('close')">
    <form class="my-auto w-full max-w-[780px] overflow-hidden rounded-lg border border-white/[0.10] bg-[#202126] shadow-2xl" @submit.prevent="save">
      <header class="flex items-center justify-between border-b border-white/[0.08] p-5">
        <div><h2 class="text-lg font-semibold">新增 Case</h2><p class="mt-1 text-xs text-[#94a3b8]">仅保存脱敏编号与诊疗必要信息，创建后可继续添加 WSI。</p></div>
        <button type="button" class="text-[#94a3b8]" aria-label="关闭" @click="emit('close')"><X :size="19" /></button>
      </header>
      <div class="grid gap-4 p-5 sm:grid-cols-2">
        <label class="case-field"><span>Case 编号 <i>*</i></span><input v-model="form.id" required placeholder="例如 S-20260907-0001" /></label>
        <label class="case-field"><span>脱敏患者编号 <i>*</i></span><input v-model="form.patientCode" required placeholder="例如 PT-0001" /></label>
        <label class="case-field"><span>收样日期 <i>*</i></span><input v-model="form.receivedAt" required type="date" /></label>
        <label class="case-field"><span>优先级</span><select v-model="form.priority"><option>常规</option><option>加急</option></select></label>
        <label class="case-field"><span>取材部位 <i>*</i></span><select v-model="form.site" required><option value="" disabled>请选择</option><option v-for="item in PATHOLOGY_SITE_OPTIONS" :key="item.value" :value="item.value">{{ item.label }}</option></select></label>
        <label class="case-field"><span>取材方式 <i>*</i></span><select v-model="form.samplingMethod" required><option value="" disabled>请选择</option><option v-for="item in SAMPLING_METHOD_OPTIONS" :key="item.value" :value="item.value">{{ item.label }}</option></select></label>
        <label class="case-field sm:col-span-2"><span>临床诊断 <i>*</i></span><input v-model="form.diagnosis" required placeholder="填写临床诊断或送检原因" /></label>
        <label class="case-field"><span>年龄</span><input v-model.number="form.age" type="number" min="0" max="130" placeholder="可选" /></label>
        <label class="case-field"><span>性别</span><select v-model="form.sex"><option>未知</option><option>男</option><option>女</option></select></label>
        <label class="case-field"><span>送检科室</span><input v-model="form.department" placeholder="例如乳腺外科" /></label>
        <label class="case-field"><span>处理状态</span><select v-model="form.status"><option>待处理</option><option>处理中</option><option>就绪</option><option>异常</option></select></label>
        <label class="case-field sm:col-span-2"><span>备注</span><textarea v-model="form.remark" placeholder="可选：特殊取材要求、质量情况或研究队列信息" /></label>
        <p v-if="error" class="sm:col-span-2 text-sm text-[#ff9c9c]">{{ error }}</p>
        <p class="sm:col-span-2 text-xs text-[#64748b]"><span class="required-mark">*</span> 为必填项</p>
      </div>
      <footer class="flex justify-end gap-2 border-t border-white/[0.08] p-4"><button type="button" class="btn-ghost" @click="emit('close')">取消</button><button class="btn-primary" type="submit">创建 Case</button></footer>
    </form>
  </div>
</template>

<style scoped>
.case-field{display:grid;gap:7px;color:#cbd5e1;font-size:13px}.case-field i{color:#ff6b73;font-style:normal;font-weight:700}.case-field input,.case-field select,.case-field textarea{border:1px solid rgb(255 255 255 / .08);border-radius:6px;background:#17181d;padding:9px 10px;color:#e2e8f0;outline:none}.case-field input:focus,.case-field select:focus,.case-field textarea:focus{border-color:rgb(143 53 183 / .65)}.case-field textarea{min-height:76px;resize:vertical}
</style>
