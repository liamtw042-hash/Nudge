const ONES = [
  'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
  'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen',
];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

/** 0–99 as words. Enough for any sensible step. */
export function numberWord(n: number): string {
  if (n < 20) return ONES[n];
  if (n < 100) {
    const t = Math.floor(n / 10);
    const o = n % 10;
    return o === 0 ? TENS[t] : `${TENS[t]}-${ONES[o]}`;
  }
  return String(n);
}

function capital(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** "2:00", "0:45", "10:00". What the dial shows. */
export function clock(totalSeconds: number): string {
  const s = Math.max(0, Math.ceil(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r < 10 ? '0' : ''}${r}`;
}

/**
 * How the voice says a length. Dry and short: "Two minutes." "Ninety seconds."
 * "A minute and a half." Never "2m".
 */
export function spokenDuration(seconds: number): string {
  const s = Math.round(seconds);
  if (s < 60) return capital(`${numberWord(s)} seconds`);
  if (s === 60) return 'One minute';
  if (s === 90) return 'A minute and a half';
  if (s < 120) return `One minute ${numberWord(s - 60)}`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (r === 0) return capital(`${numberWord(m)} minutes`);
  if (r === 30) return capital(`${numberWord(m)} and a half minutes`);
  return capital(`${numberWord(m)} minutes ${numberWord(r)}`);
}

/** Compact, for meta lines: "30 sec", "2 min", "1½ min". */
export function shortDuration(seconds: number): string {
  const s = Math.round(seconds);
  if (s < 60) return `${s} sec`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (r === 0) return `${m} min`;
  if (r === 30) return `${m}½ min`;
  return `${m}:${r < 10 ? '0' : ''}${r}`;
}

/** Whole-routine length, rounded to the minute, never "0 min". */
export function totalMinutes(seconds: number): string {
  const m = Math.max(1, Math.round(seconds / 60));
  return `${m} min`;
}

/** Spoken whole-routine length: "eleven minutes", "about a minute". */
export function spokenMinutes(seconds: number): string {
  const m = Math.round(seconds / 60);
  if (m <= 1) return 'about a minute';
  return `${numberWord(m)} minutes`;
}

/** "Six things", "One thing". */
export function countWord(n: number, noun: string): string {
  const w = n < 100 ? numberWord(n) : String(n);
  return `${capital(w)} ${noun}${n === 1 ? '' : 's'}`;
}

/** "7:14" in the device's local time, no seconds. */
export function clockTime(date: Date): string {
  const h = date.getHours();
  const m = date.getMinutes();
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m < 10 ? '0' : ''}${m} ${h < 12 ? 'am' : 'pm'}`;
}
