import { NextResponse } from "next/server";
import { authMiddleware, redirect, redirectToSignIn } from "@clerk/nextjs/server";

export default authMiddleware({
  publicRoutes: ["/"],
  afterAuth(auth, req, evt) {
    // Handle users who aren't authenticated
    if (auth.userId && auth.isPublicRoute) {
      const mainPage = new URL("/dashboard", req.url);
      return NextResponse.redirect(mainPage);
    }
    if (!auth.userId && !auth.isPublicRoute) {
      return redirectToSignIn({ returnBackUrl: req.url });
    }
    // Redirect signed in users to organization selection page if they are not active in an organization
    // If the user is signed in and trying to access a protected route, allow them to access route
    if (auth.userId && !auth.isPublicRoute) {
      return NextResponse.next();
    }
  },
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/(api|trpc)(.*)"],
};
