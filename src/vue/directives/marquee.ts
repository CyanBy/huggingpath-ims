/**
 * 跑马灯指令：实测内容溢出容器时，悬停自动横向滚动。
 * 模板只放一份文本；溢出了指令才克隆第二份进 DOM（无缝循环），不溢出就没有副本。
 * 需要配套 CSS（.title-marquee / .title-marquee-track / .title-marquee-live）。
 */
function setupMarquee(el: HTMLElement) {
  const track = el.querySelector('.title-marquee-track') as HTMLElement | null
  const first = track?.firstElementChild as HTMLElement | null
  if (!track || !first) return
  // 第一份为纯文本（副本的间距用 margin，不影响 scrollWidth 测量）
  const overflow = first.scrollWidth > el.clientWidth + 1
  const clone = track.querySelector('[data-marquee-clone]')
  if (overflow && !clone) {
    const copy = first.cloneNode(true) as HTMLElement
    copy.setAttribute('aria-hidden', 'true')
    copy.setAttribute('data-marquee-clone', '')
    track.appendChild(copy)
  } else if (!overflow && clone) {
    clone.remove()
  }
  el.classList.toggle('title-marquee-live', overflow)
}

export const vMarquee = {
  mounted: (el: HTMLElement) => {
    setupMarquee(el)
    el.addEventListener('mouseenter', () => setupMarquee(el))
  },
  updated: (el: HTMLElement) => setupMarquee(el),
}
