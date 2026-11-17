import type { PGlite } from "@electric-sql/pglite";

/**
 * The five shortlisted venues as they were in production when dog policy
 * showed "Unknown": the answer lives in the notes, the structured fields
 * are blank. Wording is taken from the real records.
 */
export const VENUES = {
  palm: {
    name: "PALM Beach Banqueting",
    contact: "Alfredo Mineo",
    website: "https://www.palmbeachclub.it/",
    notes:
      "Dog policy: Dogs are permitted at the wedding ceremony and for photographs. The venue also confirmed the dog may stay in the couple’s complimentary room. Permission for the aperitif, dinner and party has not been confirmed.\n\nFULL VENUE ADDRESS: Strada Statale 113 n°14, 90014 Casteldaccia (PA), Sicily, Italy\nOfficial website: https://www.palmbeachclub.it/\n\n- English planning support and multilingual/English-speaking staff confirmed.",
  },
  baglio: {
    name: "Baglio Oneto Luxury Wine Resort",
    contact: null,
    website: "https://www.bagliooneto.it/en/",
    notes:
      "Dog policy: A small dog is welcome for the ceremony and photographs. Overnight stays are permitted for €30 per night. Permission for the aperitif, dinner and indoor after-party has not been confirmed.\n\nFULL VENUE ADDRESS: Contrada Baronazzo Amafi 8, 91025 Marsala (TP), Sicily, Italy\nOfficial website: https://www.bagliooneto.it/en/\n\n- English support confirmed.",
  },
  cantine: {
    name: "Cantine De Gregorio",
    contact: null,
    website: "https://www.cantinedegregorio.it/en/",
    notes:
      "Dog policy: A small, well-behaved dog is permitted provided he/she stays on a leash. No on-site accommodation.\n\nFULL VENUE ADDRESS: Contrada Ragana, 92019 Sciacca (AG), Sicily, Italy\nVAT and mandatory staffing/service charges unconfirmed.",
  },
  el29: {
    name: "El 29",
    contact: null,
    website: "https://el29sevilla.com/",
    notes:
      "Dog policy: Dogs are permitted for the ceremony and photographs only. Permission for the aperitif, dinner and party has not been granted/confirmed.\n\nFULL VENUE ADDRESS: Avenida Isabel la Católica 2, Parque de María Luisa, 41013 Sevilla, Spain\n\n- Contact: Sandra Rollán; email not captured.\n- Menus: Suspiros €125 pp incl VAT; El Cid €130 pp incl VAT.",
  },
  tonnara: {
    name: "Hotel La Tonnara",
    contact: "Maria Antonietta Di Gesu",
    website: "https://www.hoteltonnara.it/",
    notes:
      "Dog policy: Hotel accommodation accepts pets up to 20 kg for €30 per room per stay. This confirms pet-friendly overnight accommodation, not permission to bring a dog to the wedding ceremony, aperitif, dinner or party; event access is unconfirmed.\n\nFULL VENUE ADDRESS: Largo Tonnara, snc, 90019 Trabia (PA), Sicily, Italy",
  },
} as const;

export type VenueKey = keyof typeof VENUES;

export async function seedVenues(db: PGlite): Promise<Record<VenueKey, string>> {
  const ids = {} as Record<VenueKey, string>;
  for (const [key, venue] of Object.entries(VENUES) as [VenueKey, (typeof VENUES)[VenueKey]][]) {
    const { rows } = await db.query<{ id: string }>(
      "insert into vendors (category, name, contact_name, website, notes) values ('venue', $1, $2, $3, $4) returning id",
      [venue.name, venue.contact, venue.website, venue.notes],
    );
    ids[key] = rows[0].id;
    await db.query("insert into venue_details (vendor_id, outreach_status, fee_includes_vat) values ($1, 'replied', null)", [ids[key]]);
    await db.query("insert into venue_profile (vendor_id) values ($1)", [ids[key]]);
  }
  return ids;
}
