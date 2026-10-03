/**
 * Reads the Alfresco login ticket that ADF stores at sign-in.
 *
 * Verified against a stock Alfresco Content App: ADF writes `ticket-ECM` into localStorage,
 * e.g. `TICKET_d54f7a...`. Nothing in ACA has to be modified or subclassed to read it, which
 * is what lets this extension drop the credential-capturing login screen entirely.
 *
 * The other key names are accepted because ADF has used them across versions and storage
 * providers; the final scan is a last resort for a renamed key.
 */
const ECM_TICKET_KEYS = ['ticket-ECM', 'ticket_ECM', 'auth_ticket'];

function normalize(value: string): string {
  return value.trim().replace(/^"+|"+$/g, '');
}

function readFrom(storage: Storage | null | undefined): string | null {
  if (!storage) {
    return null;
  }
  for (const key of ECM_TICKET_KEYS) {
    const value = storage.getItem(key);
    if (value) {
      const t = normalize(value);
      if (t.startsWith('TICKET_')) {
        return t;
      }
    }
  }
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    const value = key ? storage.getItem(key) : null;
    if (value) {
      const t = normalize(value);
      if (t.startsWith('TICKET_')) {
        return t;
      }
    }
  }
  return null;
}

/** The current Alfresco ticket, or null when nobody is signed in. */
export function findEcmTicket(): string | null {
  const local = typeof localStorage !== 'undefined' ? localStorage : null;
  const session = typeof sessionStorage !== 'undefined' ? sessionStorage : null;
  return readFrom(local) ?? readFrom(session);
}
