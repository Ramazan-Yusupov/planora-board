export type SupabasePublicConfig = Readonly<{
  publishableKey: string;
  url: string;
}>;

export function getSupabasePublicConfig(): SupabasePublicConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    return null;
  }

  return { publishableKey, url };
}

export function createHandleEmail(handle: string): string {
  return `${handle.slice(1)}@users.planora.dev`;
}

export function normalizeAuthHandle(value: string): string {
  return value.trim().toLocaleLowerCase("en-US");
}

export function isValidAuthHandle(value: string): boolean {
  return /^@[a-z0-9_]{3,24}$/.test(value);
}
