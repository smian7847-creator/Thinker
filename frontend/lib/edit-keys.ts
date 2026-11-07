import { local } from './storage';

/**
 * Edit keys for sites claimed from this browser. Our origin never runs code
 * that people published (that lives in opaque-origin frames), so it is safe
 * to keep them here. They are deliberately not kept in tab history.
 */
const NAME = 'edit-keys';

function all(): Record<string, string> {
  return local.getJson<Record<string, string>>(NAME) ?? {};
}

export function getEditKey(address: string): string | undefined {
  return all()[address];
}

export function saveEditKey(address: string, key: string) {
  local.setJson(NAME, { ...all(), [address]: key });
}
