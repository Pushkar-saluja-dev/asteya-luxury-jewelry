# ASTEYA Security Notice

## ⚠️ CRITICAL: Credential Rotation Required

If this repository was public or shared, **immediately rotate the following credentials**:

### 1. Google Gemini API Key
- **Action:** Revoke and generate a new key
- **URL:** https://aistudio.google.com/apikey
- **Files affected:** `.env`

### 2. NVIDIA API Key
- **Action:** Revoke and generate a new key
- **URL:** https://build.nvidia.com/
- **Files affected:** `.env`

### 3. Supabase Credentials
- **Action:** Regenerate the anon key in Supabase dashboard
- **URL:** https://supabase.com/dashboard/project/_/settings/api
- **Files affected:** `.env`

### 4. Clerk Publishable Key
- **Action:** Generate new key in Clerk dashboard
- **URL:** https://dashboard.clerk.com/
- **Files affected:** `.env`

### 5. Gmail/SMTP Password
- **Action:** Revoke app password and generate new one
- **URL:** https://myaccount.google.com/apppasswords
- **Files affected:** `.env`

---

## Security Improvements Implemented

The following security hardening has been applied to this codebase:

### ✅ Rate Limiting
- AI endpoints: 30 requests/minute
- Upload endpoint: 10 requests/minute
- Checkout endpoint: 5 requests/minute
- Products endpoint: 100 requests/minute

### ✅ CORS Configuration
- Configurable via `ALLOWED_ORIGINS` environment variable
- Default: localhost only
- Headers restricted to necessary ones only

### ✅ Input Validation
- Product creation/edit endpoints validate all input
- File upload validates MIME types and extensions
- File names sanitized to prevent path traversal
- File size limited to 50MB

### ✅ Server-Side Admin Verification
- All admin endpoints now verify admin email server-side
- Client-side admin checks are no longer trusted
- Security events logged with timestamps

### ✅ Security Headers
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `X-XSS-Protection: 1; mode=block`

### ✅ Environment Variable Sanitization
- `.env.example` now contains only placeholders
- Real credentials should never be committed
- Sensitive values documented for rotation

---

## Next Steps for Production

1. **Enable HTTPS** - Ensure all traffic is over HTTPS in production
2. **Configure CSP** - Add Content-Security-Policy headers
3. **Enable CSRF Protection** - Implement CSRF tokens for state-changing requests
4. **Add Authentication Middleware** - Use Clerk or similar for proper auth
5. **Audit Logs** - Set up centralized logging for security events
6. **Database Row Level Security** - Configure RLS policies in Supabase

---

Generated: 2026-06-11