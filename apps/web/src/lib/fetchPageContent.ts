const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';

export async function fetchPageContent<T>(slug: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(`${API}/content/pages/${slug}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return fallback;
    const page = await res.json();
    if (!page?.content) return fallback;
    return JSON.parse(page.content) as T;
  } catch {
    return fallback;
  }
}
