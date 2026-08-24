/** Decorative backdrop for the guest-facing site — a translucent admin-uploaded
 *  photo, or a soft romantic gradient-and-dot pattern when none is set. */
export function GuestBackgroundLayer({ imageUrl }: { imageUrl: string | null }) {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-whitewash">
      <div className="absolute inset-0 bg-gradient-to-br from-sand via-whitewash to-aegean-light/15" />
      <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-terracotta/20 blur-3xl" />
      <div className="absolute top-1/3 -right-32 h-96 w-96 rounded-full bg-aegean/15 blur-3xl" />
      <div className="absolute bottom-0 left-1/4 h-80 w-80 rounded-full bg-gold/20 blur-3xl" />
      <div className="romantic-pattern absolute inset-0 opacity-40" />

      {imageUrl && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary uploaded/hosted image */}
          <img src={imageUrl} alt="" className="h-full w-full object-cover opacity-25" />
          <div className="absolute inset-0 bg-gradient-to-b from-whitewash/60 via-whitewash/55 to-whitewash/80" />
        </>
      )}
    </div>
  );
}
