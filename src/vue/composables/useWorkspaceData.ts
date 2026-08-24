import { onMounted, onUnmounted, shallowRef } from 'vue'
import {
  readWorkspaceCases,
  readWorkspaceProjects,
  readWorkspaceWsis,
  subscribeWorkspace,
} from '../data/pathologyWorkspace'

export function useWorkspaceData() {
  const wsis = shallowRef(readWorkspaceWsis())
  const cases = shallowRef(readWorkspaceCases())
  const projects = shallowRef(readWorkspaceProjects())
  const refresh = () => {
    wsis.value = readWorkspaceWsis()
    cases.value = readWorkspaceCases()
    projects.value = readWorkspaceProjects()
  }
  let unsubscribe: (() => void) | undefined
  onMounted(() => { unsubscribe = subscribeWorkspace(refresh) })
  onUnmounted(() => unsubscribe?.())
  return { wsis, cases, projects, refresh }
}
