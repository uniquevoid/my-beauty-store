const ADMIN_TOKEN_KEY = 'admin_token';

const ADMIN_TENANT_SLUG_KEY = 'admin_tenant_slug';



export function getAdminToken() {

  return localStorage.getItem(ADMIN_TOKEN_KEY);

}



export function getAdminTenantSlug() {

  return localStorage.getItem(ADMIN_TENANT_SLUG_KEY)?.trim().toLowerCase() || null;

}



export function setAdminToken(token: string) {

  localStorage.setItem(ADMIN_TOKEN_KEY, token);

}



export function setAdminTenantSlug(slug: string) {

  localStorage.setItem(ADMIN_TENANT_SLUG_KEY, slug.trim().toLowerCase());

}



export function clearAdminToken() {

  localStorage.removeItem(ADMIN_TOKEN_KEY);

  localStorage.removeItem(ADMIN_TENANT_SLUG_KEY);

}



export function isAdminLoggedIn() {

  return Boolean(getAdminToken());

}

