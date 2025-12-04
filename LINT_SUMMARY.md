# Supabase Auth Lint Summary

## Issue: Leaked Password Protection Disabled

**Severity**: Medium/High
**Source**: Supabase Security Lint

### Description
Supabase Auth has a feature to prevent the use of compromised passwords by checking against [HaveIBeenPwned.org](https://haveibeenpwned.com/). This feature is currently disabled in the Supabase project associated with this repository. Enabling it enhances security by preventing users from setting passwords that have appeared in known data breaches.

### Required Actions

Since this setting is managed via the Supabase Dashboard and not directly exposed in the codebase configuration (unless using specific Supabase management API setups not present here), manual action is required.

#### 1. Enable Feature in Supabase Dashboard
1. Log in to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Navigate to your project.
3. Go to **Authentication** -> **Providers** -> **Email**.
4. Scroll to the **Security** section.
5. Toggle on **"Disallow compromised passwords (HIBP)"**.

#### 2. Client-Side Implementation Notes
*Current Status*: This repository currently does not contain client-side authentication forms (Login/Signup) or `users` table definitions in `schema.sql`.

When authentication is implemented in the Frontend (`frontend/src/routes/login`, `frontend/src/routes/signup`), the following practices should be adopted to complement the HIBP check:

*   **Error Handling**: Handle 422 Unprocessable Entity errors or specific error messages from `supabase.auth.signUp()` or `supabase.auth.updateUser()` that indicate a weak/compromised password.
    *   *Example Message*: "Password is known to be compromised."
    *   *Action*: Display a clear error to the user: "This password has appeared in a data breach. Please choose a different, unique password."
*   **Password Complexity**: Enforce minimum length (e.g., 12 chars) and character variety on the client side before submission.

#### 3. Secure Password Change Flows
Ensure that all future password reset/change features use the native Supabase Auth methods (`supabase.auth.updateUser`) to ensure the HIBP check is enforced.
