/** Non-secret UX flag: first-run studio tour. Never used for auth tokens. */

export const ONBOARDING_STORAGE_KEY = "fadeline.onboarding.seen.v1";

export function hasCompletedOnboarding(): boolean {
  try {
    return window.localStorage.getItem(ONBOARDING_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function markOnboardingCompleted(): void {
  try {
    window.localStorage.setItem(ONBOARDING_STORAGE_KEY, "1");
  } catch {
    // Private mode / blocked storage — tour may repeat; fail soft.
  }
}

export function clearOnboardingCompleted(): void {
  try {
    window.localStorage.removeItem(ONBOARDING_STORAGE_KEY);
  } catch {
    // ignore
  }
}
