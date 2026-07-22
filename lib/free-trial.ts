export const FREE_TRIAL_MONTHS = 6;

export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

export function getTrialEndsAt(signedUpAt: Date): Date {
  return addMonths(signedUpAt, FREE_TRIAL_MONTHS);
}

export function isWithinFreeTrial(signedUpAt: Date, now = new Date()): boolean {
  return now < getTrialEndsAt(signedUpAt);
}

export function formatTrialEndDate(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    timeZone: "Europe/London",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
