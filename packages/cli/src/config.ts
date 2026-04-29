// PURPOSE: Stores and retrieves OAuth client credentials locally.
// Credentials are saved to ~/.config/jqm/config.json (via the conf package).
// The client_secret is stored in plaintext locally — users should treat
// their credentials file like an SSH key and not share it.

import Conf from 'conf'

interface Credentials {
  clientId: string
  clientSecret: string
  serverUrl: string
}

const store = new Conf<{ credentials: Credentials | null }>({
  projectName: 'jqm',
  defaults: { credentials: null },
})

export function getCredentials(): Credentials | null {
  return store.get('credentials')
}

export function saveCredentials(creds: Credentials): void {
  store.set('credentials', creds)
}

export function clearCredentials(): void {
  store.set('credentials', null)
}

export function getConfigPath(): string {
  return store.path
}
