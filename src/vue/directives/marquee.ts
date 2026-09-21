/**
 * 跑马灯指令：实测内容溢出容器时（悬停）自动横向滚动。
 * 第一份文本右侧带循环间隙 padding，测量真实文字宽度需减去。
 * 需要配套 CSS（.title-marquee / .title-marquee-track / .title-marquee-live）。
 */
function checkMarquee(el: HTMLElement) {
  const track = el.querySelector('.title-marquee-track')
  const first = track?.firstElementChild as HTMLElement | null
  if (!first) return
  const gap = parseFloat(getComputedStyle(first).paddingRight) || 0
  const overflow = first.scrollWidth - gap > el.clientWidth + 1
  el.classList.toggle('title-marquee-live', overflow)
}

export const vMarquee = {
  mounted: (el: HTMLElement) => {
    checkMarquee(el)
    el.addEventListener('mouseenter', () => checkMarquee(el))
  },
  updated: (el: HTMLElement) => checkMarquee(el),
}
