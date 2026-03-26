const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';

/** Deep-merge `source` into `target`.
 *  - Plain objects are merged recursively.
 *  - Arrays and primitives from `source` replace `target` entirely.
 *  - Keys present only in `target` (the fallback) are kept as-is.
 */
function deepMerge<T>(target: T, source: Partial<T>): T {
  if (!source || typeof source !== 'object' || Array.isArray(source)) return source as T;
  const result: any = { ...(target as any) };
  for (const key of Object.keys(source) as (keyof T)[]) {
    const sv = (source as any)[key];
    const tv = (target as any)[key];
    if (
      sv !== null &&
      typeof sv === 'object' &&
      !Array.isArray(sv) &&
      typeof tv === 'object' &&
      tv !== null &&
      !Array.isArray(tv)
    ) {
      result[key] = deepMerge(tv, sv);
    } else {
      result[key] = sv;
    }
  }
  return result as T;
}

export async function fetchPageContent<T extends object>(slug: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(`${API}/content/pages/${slug}`, {
      cache: 'no-store', // always fetch latest — admin changes show immediately
    });
    if (!res.ok) return fallback;
    const page = await res.json();
    if (!page?.content) return fallback;
    const parsed = JSON.parse(page.content) as Partial<T>;
    // Merge: DB content wins, fallback fills any missing keys
    return deepMerge(fallback, parsed);
  } catch {
    return fallback;
  }
}
