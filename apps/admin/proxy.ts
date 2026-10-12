import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Rafraîchit la session Supabase et renvoie les visiteurs non connectés vers /connexion.
// Le contrôle du rôle admin se fait dans le layout (requête profil) ; la RLS protège les données dans tous les cas.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (list) => {
          list.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims && request.nextUrl.pathname !== '/connexion') {
    return NextResponse.redirect(new URL('/connexion', request.url));
  }
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|logo-emd.jpg|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)',
  ],
};
