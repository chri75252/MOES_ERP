import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import Link from "next/link";
import "./globals.css";

export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className="bg-slate-50 font-sans text-slate-900" suppressHydrationWarning>
          <div className="min-h-screen flex flex-col">
            <header className="sticky top-0 z-50 border-b border-slate-200 bg-white px-4 py-3 shadow-sm sm:px-6">
              <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
                <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-slate-900 hover:text-slate-700 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
                  <span>MCE Command Center</span>
                </Link>
                
                <nav className="hidden items-center gap-1 md:flex">
                  <Link 
                    href="/dashboard" 
                    className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                  >
                    Dashboard
                  </Link>
                  <Link 
                    href="/projects" 
                    className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                  >
                    Projects
                  </Link>
                  <Link 
                    href="/tenders" 
                    className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                  >
                    Tenders
                  </Link>
                  <Link 
                    href="/documents" 
                    className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                  >
                    Documents
                  </Link>
                  <Link 
                    href="/notifications" 
                    className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                  >
                    Notifications
                  </Link>
                </nav>

                <div className="flex items-center gap-3">
                  <SignedOut>
                    <Link
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      href="/sign-in"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 22 4 17"></polyline><line x1="15" y1="12" x2="15" y2="22"></line></svg>
                      Sign in
                    </Link>
                  </SignedOut>
                  <SignedIn>
                    <UserButton 
                      appearance={{
                        elements: {
                          avatarBox: "w-10 h-10",
                        },
                      }}
                    />
                  </SignedIn>
                </div>
              </div>
            </header>
            <main className="mx-auto flex-1 max-w-7xl px-4 py-6 sm:px-6">{children}</main>
            
            <footer className="border-t border-slate-200 bg-white px-6 py-4">
              <div className="mx-auto max-w-7xl text-center text-sm text-slate-500">
                © 2026 MCE Command Center. All rights reserved.
              </div>
            </footer>
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}
