/**
 * 新用户引导状态：每个提示每浏览器只显示一次。
 * 预留 resetOnboarding() 供将来「重新查看引导」入口使用。
 */

const STORAGE_KEY = 'huggingpath.onboarding.v1'

type OnboardingState = {
  hints: Record<string, boolean>
}

function readState(): OnboardingState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { hints: {} }
    const value = JSON.parse(raw)
    return value && typeof value === 'object' && value.hints ? value : { hints: {} }
  } catch {
    return { hints: {} }
  }
}

function writeState(state: OnboardingState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function hasSeenHint(key: string): boolean {
  return Boolean(readState().hints[key])
}

export function markHintSeen(key: string) {
  const state = readState()
  state.hints[key] = true
  writeState(state)
}

export function resetOnboarding() {
  localStorage.removeItem(STORAGE_KEY)
}
