import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import useDebounce from "../hooks/useDebounce";

describe("useDebounce", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("updates only after the delay", () => {
    const { result, rerender } = renderHook(({ v }) => useDebounce(v, 400), { initialProps: { v: "a" } });
    rerender({ v: "ab" });
    rerender({ v: "abc" });
    expect(result.current).toBe("a"); // still the old value
    act(() => vi.advanceTimersByTime(400));
    expect(result.current).toBe("abc"); // only the LAST value is applied
  });
});
