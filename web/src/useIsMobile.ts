import { onMounted, onUnmounted, ref } from 'vue';

// 响应式判断是否为移动端（窄屏），断点 768px
export function useIsMobile(breakpoint = 768) {
  const isMobile = ref(false);
  let mql: MediaQueryList | null = null;
  const update = () => {
    isMobile.value = mql ? mql.matches : window.innerWidth <= breakpoint;
  };

  onMounted(() => {
    mql = window.matchMedia(`(max-width: ${breakpoint}px)`);
    update();
    mql.addEventListener('change', update);
  });
  onUnmounted(() => {
    mql?.removeEventListener('change', update);
  });

  return { isMobile };
}
