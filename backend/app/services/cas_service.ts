// PURPOSE: Handles all direct communication with the VT CS CAS server.
// Encapsulates the CAS protocol so the controller stays clean.
// Builds redirect URLs, validates tickets, and parses XML responses.
// DESIGN: Written as a pure service with no AdonisJS-specific dependencies
// so it can be tested independently. Uses axios for HTTP and fast-xml-parser
// for XML parsing — no passport or external CAS library needed. The XML
// parsing handles the CAS 2.0 protocol response format directly.
// CAS_SERVICE_URL defaults to empty string if not set — the app will still
// start but CAS login will not work until the env var is configured.
// DEPENDENCIES: axios, fast-xml-parser, start/env.ts
// CONSUMERS: cas_controller.ts
// NEXT TEAM NOTES: If VT changes their CAS server or attributes, this is the
// only file that needs updating. The parseValidationResponse() method handles
// the XML structure — if attribute names change, update the keys there.
// To switch from VT CS CAS to university-wide CAS, change CAS_BASE_URL in
// .env to https://login.vt.edu/profile/cas — no code changes needed.
// ENV VARS REQUIRED:
// CAS_BASE_URL=https://login.cs.vt.edu/cas
// CAS_SERVICE_URL=https://webcatmaxxers.discovery.cs.vt.edu/api/auth/cas/callback

import axios from 'axios'
import { XMLParser } from 'fast-xml-parser'
import env from '#start/env'

/**
 * CasService
 *
 * Handles all communication with the VT CS CAS server.
 * CAS (Central Authentication Service) is VT's single sign-on system.
 *
 * Flow:
 *   1. User visits GET /api/auth/cas
 *   2. Backend redirects to CAS login page with service URL
 *   3. User authenticates at login.cs.vt.edu
 *   4. CAS redirects back to /api/auth/cas/callback?ticket=ST-xxx
 *   5. Backend validates ticket with CAS server
 *   6. CAS returns user's PID and attributes
 *   7. Backend finds or creates user via identity table
 *   8. Backend issues API token and redirects to frontend
 *
 * IMPORTANT: CAS only works on the Discovery cluster — not localhost.
 * You must deploy to test this. The cluster is pre-registered with VT CS CAS.
 *
 * CAS Server: https://login.cs.vt.edu/cas
 * Reference: https://www.middleware.vt.edu/sso/cas.html
 */
export default class CasService {
  private casBaseUrl: string
  private serviceUrl: string
  private parser: XMLParser

  constructor() {
    this.casBaseUrl = env.get('CAS_BASE_URL', 'https://login.cs.vt.edu/cas')
    this.serviceUrl = env.get('CAS_SERVICE_URL', '')
    this.parser = new XMLParser({ ignoreAttributes: false })
  }

  /**
   * Build the CAS login redirect URL.
   * Send the user to this URL to begin CAS authentication.
   */
  getLoginUrl(): string {
    const params = new URLSearchParams({ service: this.serviceUrl })
    return `${this.casBaseUrl}/login?${params.toString()}`
  }

  /**
   * Build the CAS logout redirect URL.
   * Sending the user here ends their CAS session university-wide.
   */
  getLogoutUrl(): string {
    const params = new URLSearchParams({ service: this.serviceUrl })
    return `${this.casBaseUrl}/logout?${params.toString()}`
  }

  /**
   * Validate a CAS service ticket with the CAS server.
   * Called in the callback after CAS redirects back with ?ticket=ST-xxx.
   *
   * Returns the validated user's PID and attributes on success,
   * or null if the ticket is invalid or expired.
   */
  async validateTicket(ticket: string): Promise<CasUser | null> {
    const params = new URLSearchParams({
      service: this.serviceUrl,
      ticket,
    })

    try {
      const response = await axios.get(`${this.casBaseUrl}/serviceValidate?${params.toString()}`, {
        timeout: 10000,
      })

      return this.parseValidationResponse(response.data)
    } catch (error) {
      console.error('[CasService] Ticket validation failed:', error)
      return null
    }
  }

  /**
   * Parse the XML response from CAS serviceValidate endpoint.
   *
   * Success response structure:
   *   <cas:serviceResponse>
   *     <cas:authenticationSuccess>
   *       <cas:user>pid123</cas:user>
   *       <cas:attributes>
   *         <cas:givenName>John</cas:givenName>
   *         <cas:sn>Doe</cas:sn>
   *         <cas:mail>johndoe@vt.edu</cas:mail>
   *       </cas:attributes>
   *     </cas:authenticationSuccess>
   *   </cas:serviceResponse>
   *
   * Failure response structure:
   *   <cas:serviceResponse>
   *     <cas:authenticationFailure code="INVALID_TICKET">
   *       Ticket ST-xxx not recognized
   *     </cas:authenticationFailure>
   *   </cas:serviceResponse>
   */
  private parseValidationResponse(xml: string): CasUser | null {
    try {
      const parsed = this.parser.parse(xml)
      const response = parsed['cas:serviceResponse']

      if (!response) return null

      const success = response['cas:authenticationSuccess']
      if (!success) {
        const failure = response['cas:authenticationFailure']
        console.error('[CasService] Authentication failure:', failure)
        return null
      }

      const pid = success['cas:user']
      const attributes = success['cas:attributes'] ?? {}

      return {
        pid,
        firstName: attributes['cas:givenName'] ?? null,
        lastName: attributes['cas:sn'] ?? null,
        email: attributes['cas:mail'] ?? `${pid}@vt.edu`,
      }
    } catch (error) {
      console.error('[CasService] Failed to parse CAS response:', error)
      return null
    }
  }
}

/**
 * Represents a validated CAS user returned from ticket validation.
 * pid is the VT PID (e.g. "thomask88") — the unique identifier for VT users.
 */
export interface CasUser {
  pid: string
  firstName: string | null
  lastName: string | null
  email: string
}
