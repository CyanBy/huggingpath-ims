<script setup lang="ts">
import { Code2, MessageCircle, Share2 } from '@lucide/vue'
import AppLogo from './AppLogo.vue'
</script>

<template>
  <footer class="border-t border-white/[0.06] bg-[#111217]">
    <div class="section-container py-10">
      <div class="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <div class="flex flex-col gap-4">
          <AppLogo show-text />
          <p class="max-w-[260px] text-sm leading-relaxed text-[#94a3b8]">开源病理 AI 模型的统一运行与评估工作台</p>
          <div class="flex gap-2">
            <a href="https://github.com/AI4DigitalPathology" target="_blank" rel="noreferrer" class="icon-link" aria-label="GitHub"><Code2 :size="18" /></a>
            <a href="#" class="icon-link" aria-label="分享"><Share2 :size="18" /></a>
            <a href="#" class="icon-link" aria-label="社区"><MessageCircle :size="18" /></a>
          </div>
        </div>
        <div v-for="group in [
          { title: '产品', links: ['探索模型', '工作台', '研究项目'] },
          { title: '资源', links: ['API 文档', '模型接入指南', '基准测试'] },
          { title: '法律', links: ['隐私政策', '用户协议', '免责声明'] },
        ]" :key="group.title" class="flex flex-col gap-3">
          <h4 class="text-sm font-semibold text-[#e2e8f0]">{{ group.title }}</h4>
          <a v-for="link in group.links" :key="link" href="#" class="text-sm text-[#94a3b8] hover:text-[#e2e8f0]">{{ link }}</a>
        </div>
      </div>
      <div class="mt-8 flex flex-col justify-between gap-2 border-t border-white/[0.06] pt-5 text-xs text-[#475569] sm:flex-row">
        <span>© 2026 HuggingPath. 仅供研究参考，不构成医疗建议。</span><span>开源项目 · MIT License</span>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.icon-link { display: grid; width: 36px; height: 36px; place-items: center; border-radius: 8px; color: #64748b; }
.icon-link:hover { background: rgb(255 255 255 / 0.06); color: #e2e8f0; }
</style>
