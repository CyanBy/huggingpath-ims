import { computed, onMounted, onUnmounted, shallowRef } from 'vue'
import {
  getDirectory,
  getSessionAccount,
  subscribeDirectory,
  type DirectorySnapshot,
} from '@/lib/accountDirectory'

export function useDirectory() {
  const directory = shallowRef<DirectorySnapshot>(getDirectory())
  const refresh = () => {
    directory.value = getDirectory()
  }

  let unsubscribe: (() => void) | undefined
  onMounted(() => {
    unsubscribe = subscribeDirectory(refresh)
  })
  onUnmounted(() => unsubscribe?.())

  const session = computed(() => getSessionAccount(directory.value))
  return { directory, session, refresh }
}
