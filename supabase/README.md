# Supabase setup for Planora

1. Create a Supabase project.
2. Copy `.env.example` to `.env.local`.
3. Fill:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `NEXT_PUBLIC_PLANORA_ADMIN_HANDLES`
4. Run `supabase/schema.sql` in the Supabase SQL editor.
5. In Auth settings, use password auth. If you keep the current handle-only UX,
   disable email confirmation or replace the generated technical email flow with
   a server-side credentials flow later.

Planora asks users for a Telegram-like handle such as `@name747`. Internally,
the client maps it to a technical email like `name747@users.planora.local`
because Supabase password auth requires email or phone credentials.
