import { afterEach, describe, expect, it } from "vitest";
import {
  ONBOARDING_STORAGE_KEY,
  clearOnboardingCompleted,
  hasCompletedOnboarding,
  markOnboardingCompleted,
} from "./onboarding-storage";

describe("onboarding-storage", () => {
  afterEach(() => {
    clearOnboardingCompleted();
  });

  it("starts incomplete and persists after mark", () => {
    expect(hasCompletedOnboarding()).toBe(false);
    markOnboardingCompleted();
    expect(hasCompletedOnboarding()).toBe(true);
    expect(localStorage.getItem(ONBOARDING_STORAGE_KEY)).toBe("1");
  });

  it("clears the flag", () => {
    markOnboardingCompleted();
    clearOnboardingCompleted();
    expect(hasCompletedOnboarding()).toBe(false);
  });
});
