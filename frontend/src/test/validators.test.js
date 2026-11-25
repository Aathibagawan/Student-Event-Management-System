import { describe, expect, it } from "vitest";
import { getFieldErrors } from "../utils/format";
import { isEmail, validateEvent, validateLogin, validatePoster, validateRegister } from "../utils/validators";

describe("validators", () => {
  it("checks emails", () => {
    expect(isEmail("a@b.co")).toBe(true);
    expect(isEmail("not-an-email")).toBe(false);
  });

  it("login needs email and password", () => {
    expect(validateLogin({ email: "", password: "" })).toEqual({ email: "Email is required.", password: "Password is required." });
    expect(validateLogin({ email: "a@b.co", password: "x" })).toEqual({});
  });

  it("register enforces a password of 8+ characters", () => {
    const errors = validateRegister({ first_name: "A", email: "a@b.co", password: "short" });
    expect(errors.password).toMatch(/8 characters/);
  });

  it("event end time must be after start time", () => {
    const base = { title: "T", date: "2030-01-01", venue: "V", registration_deadline: "2029-12-30T10:00", max_participants: 5, registration_fee: 0 };
    expect(validateEvent({ ...base, start_time: "12:00", end_time: "10:00" }).end_time).toBeTruthy();
    expect(validateEvent({ ...base, start_time: "10:00", end_time: "12:00" })).toEqual({});
  });

  it("poster must be a small image", () => {
    expect(validatePoster({ type: "application/pdf", size: 10 })).toMatch(/JPG, PNG or WEBP/);
    expect(validatePoster({ type: "image/png", size: 5 * 1024 * 1024 })).toMatch(/smaller than/);
    expect(validatePoster({ type: "image/png", size: 1000 })).toBe("");
  });

  it("maps API field errors to inputs", () => {
    const err = { response: { data: { details: { email: ["Already exists.", "Try another."] } } } };
    expect(getFieldErrors(err)).toEqual({ email: "Already exists. Try another." });
  });
});
