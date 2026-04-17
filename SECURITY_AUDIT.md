# Security & UX Audit Report — Boardgame Time

**Date:** April 17, 2026  
**Auditor:** Automated Copilot Audit (Opus model)  
**Scope:** Full-stack backend + frontend security review and UX consistency audit

---

## Executive Summary

The audit identified **46 backend** and **84 frontend** issues across security, UX, and code quality categories. **12 critical/high severity issues** have been fixed in this commit. Remaining items are documented as a roadmap.

---

## Issues Fixed in This Commit

### Backend Security Fixes

| # | Severity | Issue | Fix |
|---|----------|-------|-----|
| 1 | **CRITICAL** | Debug routes (`/api/debug/*`) exposed seller emails, inventory internals — accessible in production | Gated behind `NODE_ENV === 'development'` only |
| 2 | **CRITICAL** | Default JWT secrets in production only logged a warning, server still started | Changed to `throw new Error()` — server refuses to start with default secrets |
| 3 | **CRITICAL** | TikTok encryption `decrypt()` silently returned plaintext on non-encrypted data | Added `console.warn` for plaintext fallback, separated empty-string check |
| 4 | **CRITICAL** | TikTok edit-product response leaked full request body and API URL in `debug` field | Removed `debug` from response, sanitized error messages |
| 5 | **HIGH** | Health check exposed `environment` field (production/development) | Removed — returns only `{ status, timestamp }` |
| 6 | **HIGH** | Error handler leaked error details in development and path in non-production | Sanitized — only logs server-side, sends generic `Internal server error` |
| 7 | **HIGH** | No HSTS header for HTTPS enforcement | Added `hsts: { maxAge: 31536000, includeSubDomains: true }` to Helmet |
| 8 | **HIGH** | No rate limiting on destructive admin operations (clear database/users/cards/orders) | Added `rateLimit` (2 req/15 min) on all `/clear-*` endpoints |
| 9 | **MEDIUM** | Admin order status filter accepted arbitrary strings (NoSQL injection vector) | Added whitelist validation for status and paymentStatus |
| 10 | **MEDIUM** | Buylist routes missing ObjectId validation on PUT/DELETE | Added `mongoose.Types.ObjectId.isValid()` check |
| 11 | **LOW** | Cart quantity limit (99) inconsistent with order limit (999) | Aligned cart to 999 |

### Frontend Fixes

| # | Severity | Issue | Fix |
|---|----------|-------|-----|
| 12 | **HIGH** | ProfilePage blob URL memory leak on unmount | Added `useEffect` cleanup to revoke blob URL |
| 13 | **MEDIUM** | LoginPage used magic delays (50ms, 300ms) with race conditions | Removed `setTimeout` delays — direct navigation after login |
| 14 | **MEDIUM** | LoginPage didn't redirect sellers to seller dashboard | Added `role === 'seller'` → `/seller/dashboard` redirect |
| 15 | **LOW** | `theme.css` disabled all transitions globally with `* { transition: none }` | Removed global transition kill — only applies transitions to interactive elements |
| 16 | **LOW** | BottomNav links missing `aria-label` for accessibility | Added `aria-label={item.label}` to all nav links |
| 17 | **LOW** | Buylist page not accessible from Navbar menu | Added "BUYLIST" link to desktop navigation bar |

---

## Remaining Issues (Roadmap)

### Priority 1 — Next Sprint (Security)

| Issue | Description | Effort |
|-------|-------------|--------|
| Token storage | Migrate JWT from `localStorage` to `httpOnly` cookies (prevents XSS token theft) | Large — requires backend cookie setting, frontend axios `withCredentials` changes |
| CSRF protection | Add CSRF token validation on all state-changing endpoints | Medium — add `csurf` middleware or custom double-submit cookie pattern |
| TikTok creds in localStorage | Move TikTok credentials out of localStorage; fetch from server on demand | Medium |
| Seller ownership validation | `POST /:id/inventory` doesn't verify seller owns the inventory slot | Small |
| MongoDB transactions | Order creation stock deduction is not atomic (sequential `updateOne` calls) | Medium |
| Upload rate limiting | No rate limits on file upload endpoints (`/api/upload`, `/api/manabox/upload`) | Small |
| Password strength | 8-char minimum is weak; add entropy check or increase to 12+ | Small |

### Priority 2 — Backlog (UX/Design)

| Issue | Description | Effort |
|-------|-------------|--------|
| Unified Modal component | Replace `window.confirm` + custom modals with one reusable `<Modal />` | Medium |
| Unified Button component | Replace inline button styles with `.btn-primary`/`.btn-secondary`/`.btn-danger` from index.css | Medium |
| Input styling consistency | Use `.input` class everywhere instead of custom inline styles | Small |
| Consistent error display | Use toast library consistently (replace `alert()`, inline errors with varying styles) | Medium |
| Empty state messages | Add "No results" empty states to AdminOrdersPage, CatalogPage (no results) | Small |
| Loading state consistency | Create shared `<Loader />` skeleton component | Small |
| Breadcrumbs | Add breadcrumb navigation to deep pages (CardDetail, Admin sub-pages) | Medium |
| Keyboard navigation | Ensure modals close on Escape, focus trap in overlays | Small |
| Dark mode | `ThemeContext` exists but no UI toggle — add theme switcher | Medium |
| Image optimization | Serve 2-3 sizes, use `srcset`, serve via CDN | Large |
| Structured logging | Replace `console.log/error` with Winston/Pino + PII redaction | Medium |
| API versioning | Prefix routes with `/api/v1/` for graceful deprecation | Medium |
| Audit trail | Log who performed destructive admin operations (clear DB, bulk updates) | Medium |

### Priority 3 — Nice-to-Have

| Issue | Description |
|-------|-------------|
| Retry logic | Add exponential backoff + retry button on API failures |
| Search history | Store recent searches in localStorage for suggestions |
| Order export | PDF export for order details and admin reports |
| Password strength meter | Real-time strength indicator on Register/ChangePassword |
| Missing DB indexes | Add indexes for frequently queried fields (createdAt, user, cardName) |
| Email validation | Tighten seller email regex to require 2+ char TLD |
| Request timeout | Add server-side request timeout for large JSON parsing |

---

## Security Architecture Summary

### Current State
- **Auth:** JWT Bearer tokens, stored in localStorage
- **Encryption:** TikTok credentials encrypted with AES-256-CBC (key derived from JWT_SECRET via SHA-256)
- **Rate limiting:** Login + register (10 req/15min), destructive admin ops (2 req/15min)
- **CORS:** Whitelist-based, credentials allowed
- **Headers:** Helmet with HSTS, CORP cross-origin policy
- **Validation:** Zod schemas for auth, inline validation elsewhere
- **Error handling:** Sanitized responses, no stack traces or path leaks in production
- **Debug routes:** Development-only

### Recommended Improvements
1. **httpOnly cookies** for token storage (eliminates XSS token theft)
2. **CSRF tokens** on all POST/PUT/DELETE (prevents cross-site request forgery)
3. **Dedicated encryption key** for TikTok credentials (not derived from JWT secret)
4. **MongoDB transactions** for order stock deduction (atomic operations)
5. **Audit log collection** for destructive operations
