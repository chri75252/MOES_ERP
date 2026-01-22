import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="bg-slate-50 text-slate-900">
          <div className="min-h-screen">
            <header className="border-b bg-white px-6 py-3">
              <div className="mx-auto flex max-w-7xl items-center justify-between">
                <div className="text-lg font-semibold">MCE Command Center</div>
                <div className="flex items-center gap-3">
                  <SignedOut>
                    <a
                      className="rounded bg-slate-900 px-3 py-1.5 text-sm font-medium text-white"
                      href="/sign-in"
                    >
                      Sign in
                    </a>
                  </SignedOut>
                  <SignedIn>
                    <UserButton />
                  </SignedIn>
                </div>
              </div>
            </header>
            <main className="mx-auto max-w-7xl px-6 py-6">{children}</main>
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}
