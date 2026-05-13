/**
 * Phone-number normalisation to E.164. Mirror of web's src/lib/phone.ts.
 *
 * Speedi is UK-first but customers + pros use the platform abroad. A
 * `tel:` or `sms:` link with a UK national-format number ("07894 123 456")
 * won't connect when the dialler is on a non-UK SIM. E.164 works universally.
 */

export function normalisePhone(input: string | null | undefined): string {
  if (!input) return "";
  const trimmed = String(input).trim();
  if (!trimmed) return "";

  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return "";

  if (hasPlus) return `+${digits}`;
  if (digits.startsWith("0")) return `+44${digits.slice(1)}`;
  if (digits.startsWith("44") && digits.length >= 11) return `+${digits}`;
  if (digits.length === 10 && digits.startsWith("7")) return `+44${digits}`;
  return `+${digits}`;
}

export function phoneForDisplay(input: string | null | undefined): {
  display: string;
  dial: string;
} {
  const dial = normalisePhone(input);
  if (!dial) return { display: "", dial: "" };

  if (dial.startsWith("+44")) {
    const local = `0${dial.slice(3)}`;
    if (local.length === 11) {
      return {
        display: `${local.slice(0, 5)} ${local.slice(5, 8)} ${local.slice(8)}`,
        dial,
      };
    }
    return { display: local, dial };
  }

  return { display: dial, dial };
}
