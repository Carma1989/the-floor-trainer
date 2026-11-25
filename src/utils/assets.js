/**
 * Resolves root-relative public asset paths (e.g. "/media/...") against Vite's BASE_URL
 * so assets load both at "/" (localhost, Vercel) and in subpath deployments (GitHub Pages).
 */
export function resolveAssetUrl(src) {
  if (typeof src !== 'string' || !src.startsWith('/')) {
    return src;
  }
  const base = import.meta.env.BASE_URL || '/';
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  return `${normalizedBase}${src.slice(1)}`;
}
