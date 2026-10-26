/**
 * Every request to the splat server carries the signed-in user's Firebase ID token (2026-10-26: the box refuses
 * anonymous internet requests except reading one job's 3D view; /history, rerun, delete, star, notes... need an admin
 * account - the `admin` custom claim). Patched into window.fetch once, so the many fetch() calls across /history,
 * walk2, compare and the upload page need no change. A request that already sets Authorization is left alone.
 */
import { auth } from '@/services/firebase';

let lastToken = null;

const isSplatServer = (url) => typeof url === 'string' && url.includes('/topowall/');

/** The token, or null when signed out (Firebase refreshes it when it is about to expire). */
export async function splatToken() {
  if (!auth.currentUser) await auth.authStateReady();
  lastToken = auth.currentUser ? await auth.currentUser.getIdToken() : null;
  return lastToken;
}

/** For plain links (a download <a href>): the last token as ?access_token=, '' when there is none yet. */
export function tokenQuery() {
  return lastToken ? `?access_token=${encodeURIComponent(lastToken)}` : '';
}

export function installGatewayAuth() {
  const plain = window.fetch.bind(window);
  window.fetch = async (input, init = {}) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input?.url;
    if (!isSplatServer(url)) return plain(input, init);
    const headers = new Headers(init.headers || (input instanceof Request ? input.headers : undefined));
    if (!headers.has('Authorization')) {
      const token = await splatToken().catch(() => null);
      if (token) headers.set('Authorization', `Bearer ${token}`);
    }
    return plain(input, { ...init, headers });
  };
}
