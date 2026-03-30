import { useEffect, useRef, useCallback } from 'react';

/**
 * Smart auto-scroll: scrolls to bottom when content changes,
 * but only if the user is already near the bottom (not reading above).
 */
const useAutoScroll = (dependency, threshold = 150) => {
  const containerRef = useRef(null);
  const shouldAutoScroll = useRef(true);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    shouldAutoScroll.current = distanceFromBottom < threshold;
  }, [threshold]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !shouldAutoScroll.current) return;

    requestAnimationFrame(() => {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    });
  }, [dependency]);

  const scrollToBottom = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    shouldAutoScroll.current = true;
  }, []);

  return { containerRef, scrollToBottom };
};

export default useAutoScroll;
