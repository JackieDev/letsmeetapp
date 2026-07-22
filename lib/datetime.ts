/** UK civil time — GMT in winter, BST (UTC+1) in summer. */
export const APP_TIMEZONE = "Europe/London";

const DATETIME_LOCAL_RE =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/;

function getTimeZoneOffsetMs(timeZone: string, date: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "0";

  let hour = Number(get("hour"));
  if (hour === 24) hour = 0;

  const asUtc = Date.UTC(
    Number(get("year")),
    Number(get("month")) - 1,
    Number(get("day")),
    hour,
    Number(get("minute")),
    Number(get("second"))
  );

  return asUtc - date.getTime();
}

/**
 * Interpret a `datetime-local` value (`YYYY-MM-DDTHH:mm`) as UK wall time
 * (Europe/London — BST or GMT) and return the corresponding UTC instant.
 */
export function parseLondonDatetimeLocal(value: string): Date {
  const match = DATETIME_LOCAL_RE.exec(value.trim());
  if (!match) return new Date(NaN);

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6] ?? 0);

  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, second);
  const offset1 = getTimeZoneOffsetMs(APP_TIMEZONE, new Date(utcGuess));
  const refined = new Date(utcGuess - offset1);
  const offset2 = getTimeZoneOffsetMs(APP_TIMEZONE, refined);
  return new Date(utcGuess - offset2);
}

/** Parse event date input: datetime-local as London, otherwise ISO / Date-parseable. */
export function parseEventDateInput(value: string): Date {
  if (DATETIME_LOCAL_RE.test(value.trim())) {
    return parseLondonDatetimeLocal(value);
  }
  return new Date(value);
}

/** Format a stored instant for a `datetime-local` input in UK time. */
export function toLondonDatetimeLocalValue(date: Date | string): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";

  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(d);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "00";

  let hour = get("hour");
  if (hour === "24") hour = "00";

  return `${get("year")}-${get("month")}-${get("day")}T${hour}:${get("minute")}`;
}

/** Display date + time in UK (BST/GMT). */
export function formatAppDateTime(date: Date | string): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-GB", {
    timeZone: APP_TIMEZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/** Display date only in UK (BST/GMT). */
export function formatAppDate(date: Date | string): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", {
    timeZone: APP_TIMEZONE,
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
