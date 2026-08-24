import { onMounted, onUnmounted, shallowRef } from 'vue'
import { readAnalysisTasks, tickAnalysisTasks, type AnalysisTaskRecord } from '@/lib/analysisTasks'

export function useAnalysisTasks(enableTicker = false) {
  const tasks = shallowRef<AnalysisTaskRecord[]>(readAnalysisTasks())
  const refresh = () => { tasks.value = readAnalysisTasks() }
  let timer: number | undefined

  onMounted(() => {
    refresh()
    window.addEventListener('analysisTasksChange', refresh)
    window.addEventListener('storage', refresh)
    window.addEventListener('focus', refresh)
    if (enableTicker) timer = window.setInterval(() => tickAnalysisTasks(), 1000)
  })
  onUnmounted(() => {
    window.removeEventListener('analysisTasksChange', refresh)
    window.removeEventListener('storage', refresh)
    window.removeEventListener('focus', refresh)
    if (timer) window.clearInterval(timer)
  })

  return { tasks, refresh }
}
