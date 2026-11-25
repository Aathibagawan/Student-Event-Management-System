import { useEffect, useState } from "react";

/** Returns `value` only after it stopped changing for `delay` ms (used for search-as-you-type). */
export default function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer); // cancel the previous timer on every keystroke
  }, [value, delay]);
  return debounced;
}
