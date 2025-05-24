// middleware.ts
import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export const updateSession = async (request: NextRequest) => {
  try {
    // Create an unmodified response
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value),
            );
            response = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options),
            );
          },
        },
      },
    );

    // Refresh session if expired - required for Server Components
    const { data: { user } } = await supabase.auth.getUser();

    const isAuthenticated = !!user;
    const pathname = request.nextUrl.pathname;

    if (!isAuthenticated && pathname != '/login') {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    return response;
  } catch (e) {
    const pathname = request.nextUrl.pathname;
    
    if (pathname !== '/login') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
  }
};