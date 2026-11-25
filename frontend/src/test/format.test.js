import { describe, expect, it } from "vitest";
import { formatMoney, formatTime, getErrorMessage } from "../utils/format";

describe("format helpers", () => {
  it("formats rupees", () => {
    expect(formatMoney(9000)).toContain("9,000");
  });

  it("formats 24h time as 12h", () => {
    expect(formatTime("14:30:00")).toBe("2:30 PM");
    expect(formatTime("00:05:00")).toBe("12:05 AM");
  });

  it("reads a direct API error", () => {
    expect(getErrorMessage({ response: { data: { error: "This event is full." } } })).toBe("This event is full.");
  });

  it("flattens field validation errors", () => {
    const err = { response: { data: { error: "Request failed", details: { date: ["Event date cannot be in the past."] } } } };
    expect(getErrorMessage(err)).toBe("date: Event date cannot be in the past.");
  });

  it("explains network failures", () => {
    expect(getErrorMessage({ message: "Network Error" })).toBe("Cannot reach the server.");
  });
});
