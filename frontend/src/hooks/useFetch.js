import { useCallback, useEffect, useRef, useState } from "react";
import { getErrorMessage } from "../utils/format";

/**
 * Runs an async function on mount / when deps change; gives { data, loading, error, reload }.
 * A request counter makes sure a slow OLD response can never overwrite a newer one
 * (important with search-as-you-type).
 */
export default function useFetch(fetcher, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const latest = useRef(0);

  const load = useCallback(async () => {
    const requestId = ++latest.current;
    setLoading(true);
    setError("");
    try {
      const result = await fetcher();
      if (requestId === latest.current) setData(result);
    } catch (err) {
      if (requestId === latest.current) setError(getErrorMessage(err));
    } finally {
      if (requestId === latest.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, reload: load, setData };
}
