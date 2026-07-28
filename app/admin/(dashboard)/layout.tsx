import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { isLocalTestMode, LOCAL_TEST_USER } from "@/lib/local-test";
import { NavLink } from "./_components/nav-link";

const NAV_ITEMS = [
  { href: "/admin/guests", label: "Guests" },
  { href: "/admin/planning", label: "Planning" },
  { href: "/admin/destination", label: "Destination" },
  { href: "/admin/vendors", label: "Vendors" },
  { href: "/admin/messaging", label: "Messaging" },
  { href: "/admin/seating", label: "Seating" },
  { href: "/admin/guest-view", label: "Guest View" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const testMode = isLocalTestMode();
  const session = testMode ? { user: LOCAL_TEST_USER } : await auth();
  if (!session?.user) {
    redirect("/admin/sign-in");
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {testMode && (
        <div className="bg-terracotta px-4 py-1.5 text-center text-xs font-medium text-whitewash">
          Local test mode — auth is bypassed. Never set this in production.
        </div>
      )}
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <span className="font-display text-xl text-ink">
            Caoimhe &amp; Alexandre
          </span>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-foreground/60 sm:inline">
              {session.user.email}
            </span>
            {testMode ? (
              <span className="text-sm text-foreground/40">Sign out</span>
            ) : (
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/admin/sign-in" });
                }}
              >
                <button
                  type="submit"
                  className="text-sm font-medium text-aegean hover:underline"
                >
                  Sign out
                </button>
              </form>
            )}
          </div>
        </div>
        <nav className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4 sm:px-6">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.href} href={item.href} label={item.label} />
          ))}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6">
        {children}
      </main>
    </div>
  );
}
