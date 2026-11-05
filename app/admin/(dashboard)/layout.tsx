import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { isLocalTestMode, LOCAL_TEST_USER } from "@/lib/local-test";
import { getSiteSettings } from "@/lib/rsvp/queries";
import { GuestBackgroundLayer } from "@/app/guest/_components/guest-background-layer";
import { NavLink } from "./_components/nav-link";

const NAV_ITEMS = [
  { href: "/admin/overview", label: "Overview" },
  { href: "/admin/planning", label: "Planning" },
  { href: "/admin/guests", label: "Guests" },
  { href: "/admin/budget", label: "Budget" },
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

  const siteSettings = await getSiteSettings();

  return (
    <div className="relative isolate flex min-h-screen flex-col">
      <GuestBackgroundLayer imageUrl={siteSettings.backgroundImageUrl} />
      {testMode && (
        <div className="relative z-10 bg-terracotta px-4 py-1.5 text-center text-xs font-medium text-whitewash">
          Local test mode — auth is bypassed. Never set this in production.
        </div>
      )}
      <header className="glass-card relative z-10 rounded-none border-x-0 border-t-0">
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
      <main className="relative z-10 mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6">
        {children}
      </main>
    </div>
  );
}
