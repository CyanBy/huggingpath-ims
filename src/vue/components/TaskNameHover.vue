<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref } from 'vue'
import { getTaskDisplayName, getTaskNameDetails, type AnalysisTaskRecord } from '@/lib/analysisTasks'

const props = defineProps<{
  task: AnalysisTaskRecord
  as?: string
  nameClass?: string
}>()

const details = computed(() => getTaskNameDetails(props.task))
const pop = ref<{ x: number; y: number } | null>(null)
const popElement = ref<HTMLElement | null>(null)

async function show(event: MouseEvent | FocusEvent) {
  if (!details.value) return
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const width = Math.min(360, window.innerWidth - 24)
  const x = Math.max(12, Math.min(rect.left, window.innerWidth - width - 12))
  const below = rect.bottom + 8
  pop.value = {
    x,
    y: below,
  }
  await nextTick()
  if (!pop.value) return
  const height = popElement.value?.offsetHeight || 0
  pop.value = {
    x,
    y: below + height <= window.innerHeight - 12 ? below : Math.max(12, rect.top - height - 8),
  }
}

function hide() {
  pop.value = null
}

onBeforeUnmount(hide)
</script>

<template>
  <div
    class="task-name-hover min-w-0 flex-1"
    :class="{ 'has-details': details }"
    :tabindex="details ? 0 : undefined"
    :aria-expanded="Boolean(pop)"
    @mouseenter="show"
    @mouseleave="hide"
    @focus="show"
    @blur="hide"
    @keydown.esc="hide"
  >
    <component :is="as || 'b'" :class="nameClass">{{ getTaskDisplayName(task) }}</component>
    <Teleport to="body">
      <div
        v-if="pop && details"
        ref="popElement"
        class="task-name-pop"
        :style="{ left: `${pop.x}px`, top: `${pop.y}px` }"
        role="tooltip"
      >
        <div class="scope-summary">
          <div><span>分析范围</span><b>{{ details.slideCount }} 张 WSI</b></div>
          <small v-if="details.caseCount || details.unboundSlideCount">
            <template v-if="details.caseCount">{{ details.caseCount }} 个 Case</template>
            <template v-if="details.caseCount && details.unboundSlideCount"> · </template>
            <template v-if="details.unboundSlideCount">{{ details.unboundSlideCount }} 张未绑定</template>
          </small>
        </div>
        <section v-if="details.projects.length" class="project-scope">
          <span>所属项目</span>
          <div class="project-list"><b v-for="item in details.projects" :key="`project-${item}`">{{ item }}</b></div>
        </section>
        <section v-if="details.scopeType === 'WSI'" class="slide-scope">
          <span>切片列表</span>
          <div class="slide-list">
            <p v-for="slide in details.slides" :key="slide" :title="slide"><i />{{ slide }}</p>
          </div>
        </section>
        <section v-else class="case-scope">
          <span>Case 与切片</span>
          <article v-for="group in details.caseGroups" :key="group.caseLabel" class="case-group">
            <div class="case-heading">
              <b>{{ group.caseLabel }}</b>
              <em>{{ group.slideCount }} 张</em>
            </div>
            <p v-for="slide in group.slides" :key="`${group.caseLabel}-${slide}`" :title="slide"><i />{{ slide }}</p>
          </article>
        </section>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.task-name-hover,
.task-name-hover :deep(*) {
  min-width: 0;
  cursor: pointer;
  user-select: none;
}
.task-name-pop {
  position: fixed;
  z-index: 80;
  width: min(360px, calc(100vw - 24px));
  max-height: min(440px, calc(100vh - 24px));
  overflow-y: auto;
  border: 1px solid rgb(255 255 255 / .12);
  border-radius: 8px;
  background: #202126;
  padding: 12px;
  box-shadow: 0 16px 40px rgb(0 0 0 / .45);
  pointer-events: none;
}
.task-name-pop section + section {
  margin-top: 10px;
  border-top: 1px solid rgb(255 255 255 / .08);
  padding-top: 10px;
}
.task-name-pop span {
  display: block;
  margin-bottom: 6px;
  color: #64748b;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: .08em;
}
.scope-summary {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
}
.scope-summary span {
  margin-bottom: 3px;
}
.scope-summary b {
  display: block;
  color: #f1f5f9;
  font-size: 15px;
}
.scope-summary small {
  color: #94a3b8;
  font-size: 11px;
  white-space: nowrap;
}
.project-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.project-list b {
  border: 1px solid rgb(143 53 183 / .4);
  border-radius: 5px;
  background: rgb(143 53 183 / .14);
  padding: 3px 7px;
  color: #d292f4;
  font-size: 11px;
  font-weight: 500;
}
.case-group {
  overflow: hidden;
  border: 1px solid rgb(255 255 255 / .08);
  border-radius: 6px;
  background: #191a1f;
}
.slide-list {
  overflow: hidden;
  border: 1px solid rgb(255 255 255 / .08);
  border-radius: 6px;
  background: #191a1f;
}
.slide-list p {
  display: flex;
  align-items: center;
  gap: 7px;
  overflow: hidden;
  padding: 7px 9px;
  color: #e2e8f0;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 11px;
  line-height: 1.5;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.slide-list p + p {
  border-top: 1px solid rgb(255 255 255 / .04);
}
.slide-list i {
  width: 5px;
  height: 5px;
  flex-shrink: 0;
  border-radius: 999px;
  background: #64748b;
}
.case-group + .case-group {
  margin-top: 8px;
}
.case-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid rgb(255 255 255 / .06);
  padding: 7px 9px;
}
.case-heading b {
  overflow: hidden;
  color: #d292f4;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.case-heading em {
  flex-shrink: 0;
  color: #94a3b8;
  font-size: 10px;
  font-style: normal;
}
.case-group p {
  display: flex;
  align-items: center;
  gap: 7px;
  overflow: hidden;
  padding: 5px 9px;
  color: #e2e8f0;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 11px;
  line-height: 1.5;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.case-group p + p {
  border-top: 1px solid rgb(255 255 255 / .04);
}
.case-group p i {
  width: 5px;
  height: 5px;
  flex-shrink: 0;
  border-radius: 999px;
  background: #64748b;
}
</style>
