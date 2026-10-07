import { djangoFetch } from "@/lib/django";

export type CatalogArea = { area: string; permissions: { codename: string; description: string }[] };

/** Every permission by area, from the server (the order the role pages use). */
export function loadCatalog(token: string) {
  return djangoFetch<CatalogArea[]>("/api/v1/permissions/", { accessToken: token }).catch(() => [] as CatalogArea[]);
}
