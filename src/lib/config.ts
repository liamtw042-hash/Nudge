const env = import.meta.env;

function str(v: unknown, fallback = ''): string {
  return typeof v === 'string' && v.length > 0 ? v : fallback;
}

export const config = {
  firebase: {
    apiKey: str(env.VITE_FIREBASE_API_KEY),
    authDomain: str(env.VITE_FIREBASE_AUTH_DOMAIN),
    projectId: str(env.VITE_FIREBASE_PROJECT_ID),
    appId: str(env.VITE_FIREBASE_APP_ID),
  },
  /** True when the app should talk to Firebase; otherwise everything lives in localStorage. */
  useFirebase: str(env.VITE_FIREBASE_API_KEY).length > 0 && str(env.VITE_FIREBASE_PROJECT_ID).length > 0,
  publicUrl: str(env.VITE_PUBLIC_URL, typeof window !== 'undefined' ? window.location.origin : ''),
  supportEmail: str(env.VITE_SUPPORT_EMAIL, 'hello@example.com'),
  adminEmails: str(env.VITE_ADMIN_EMAILS)
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean),
  payInstructions: str(env.VITE_PAY_INSTRUCTIONS, 'Bank transfer details are on your invoice.').replace(/\\n/g, '\n'),
  checkoutMonthly: str(env.VITE_CHECKOUT_URL_MONTHLY),
  checkoutYearly: str(env.VITE_CHECKOUT_URL_YEARLY),
};

export function isAdminEmail(email: string | null | undefined): boolean {
  return !!email && config.adminEmails.includes(email.toLowerCase());
}
