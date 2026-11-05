/** Guest-site backdrop: the admin-uploaded photo at 25% opacity over the page's flat
 *  background. Only rendered when an image has been uploaded. */
export function GuestPhotoBackdrop({ imageUrl }: { imageUrl: string }) {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary uploaded/hosted image */}
      <img src={imageUrl} alt="" className="h-full w-full object-cover opacity-25" />
    </div>
  );
}
