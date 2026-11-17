import { describe, expect, it } from "vitest";
import { updateGuest } from "@/lib/guests/actions";
import { toGuestFormFields } from "@/lib/guests/form-fields";
import { guestFormSchema } from "@/lib/guests/schema";
import { db, withTestDatabase } from "./helpers/harness";

withTestDatabase();

async function newGuest() {
  const { rows } = await db.query<{ id: string }>(
    `insert into guests (first_name, last_name, relationship_priority, preferred_language, invited_by, notes, dietary_restrictions, plus_one_status, plus_one_requested_relationship, seating_table_id)
     values ('Ada', 'Lovelace', 2, 'en', 'caoimhe', 'sits near the band', 'vegetarian', 'approved', 'cousin', null) returning id`,
  );
  return rows[0].id;
}

describe("editing a guest in the admin changes only what the form owns", () => {
  it("saving the form keeps the plus-one request fields (production behaviour)", async () => {
    const id = await newGuest();
    const form = new FormData();
    Object.entries({
      firstName: "Ada",
      lastName: "Byron",
      email: "ada@example.com",
      relationshipPriority: "1",
      preferredLanguage: "fr",
      invitedBy: "joint",
      rsvpStatus: "yes",
      notes: "updated note",
      dietaryRestrictions: "vegan",
    }).forEach(([key, value]) => form.set(key, value));

    await expect(updateGuest(id, undefined, form)).rejects.toThrow("redirect:/admin/guests");

    const { rows } = await db.query("select * from guests where id = $1", [id]);
    expect(rows[0]).toMatchObject({
      last_name: "Byron",
      email: "ada@example.com",
      relationship_priority: 1,
      preferred_language: "fr",
      invited_by: "joint",
      rsvp_status: "yes",
      notes: "updated note",
      dietary_restrictions: "vegan",
      // Not on the form, so untouched:
      plus_one_status: "approved",
      plus_one_requested_relationship: "cousin",
    });
  });

  it("the local mock applies the same fields, so tests and local dev match production", () => {
    const parsed = guestFormSchema.parse({
      firstName: "Ada",
      relationshipPriority: "2",
      preferredLanguage: "en",
      invitedBy: "caoimhe",
    });
    const fields = toGuestFormFields(parsed);
    expect(Object.keys(fields)).not.toContain("plusOneStatus");
    expect(Object.keys(fields)).not.toContain("plusOneRequestedRelationship");
  });
});
