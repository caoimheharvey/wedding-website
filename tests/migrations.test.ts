import { describe, expect, it } from "vitest";
import { applyMigration, createDatabase, migrationFiles } from "./helpers/db";

// Production data is migrated in place, so prove the structural changes keep
// what's there: apply everything up to 0048, load legacy-shaped venues, apply
// 0049, and compare.
describe("migration 0049 preserves existing venue data", () => {
  it("maps dog policy values, keeps VAT answers, and loses nothing", async () => {
    const db = await createDatabase("0048");
    expect(migrationFiles().at(-1)).toMatch(/^0049/);

    const venue = async (name: string, details: string, profile: string) => {
      const { rows } = await db.query<{ id: string }>("insert into vendors (category, name, notes) values ('venue', $1, $2) returning id", [name, `notes for ${name}`]);
      const id = rows[0].id;
      await db.query(`insert into venue_details (vendor_id, ${details.split("|")[0]}) values ($1, ${details.split("|")[1]})`, [id]);
      await db.query(`insert into venue_profile (vendor_id, dog_policy, location, dog_notes) values ($1, ${profile})`, [id]);
      return id;
    };

    // fee_includes_vat was NOT NULL default false, so "no fee" rows carry false too.
    const a = await venue("fee, VAT included", "rental_fee_saturday, fee_includes_vat, price_per_person|2000, true, 120", "'allowed_all_day', 'Casteldaccia', 'kept note'");
    const b = await venue("fee, VAT added on top", "rental_fee_saturday, fee_includes_vat|3000, false", "'ceremony_only', 'Sciacca', null");
    const c = await venue("no fee at all", "price_per_person|130", "'not_allowed', null, null");
    const d = await venue("nothing known", "max_capacity|80", "'unknown', null, null");

    const before = await db.query("select * from venue_details order by vendor_id");
    await applyMigration(db, migrationFiles().at(-1)!);

    const profile = async (id: string) =>
      (await db.query<Record<string, unknown>>("select dog_policy, dog_accommodation, address, location, dog_notes from venue_profile where vendor_id = $1", [id])).rows[0];
    expect(await profile(a)).toEqual({ dog_policy: "welcome", dog_accommodation: "unknown", address: null, location: "Casteldaccia", dog_notes: "kept note" });
    expect((await profile(b)).dog_policy).toBe("limited");
    expect((await profile(c)).dog_policy).toBe("not_allowed");
    expect((await profile(d)).dog_policy).toBe("unknown");

    const vat = async (id: string) => (await db.query<{ fee_includes_vat: boolean | null }>("select fee_includes_vat from venue_details where vendor_id = $1", [id])).rows[0].fee_includes_vat;
    expect(await vat(a)).toBe(true); // an actual answer survives
    expect(await vat(b)).toBe(false); // so does an actual "added on top"
    expect(await vat(c)).toBeNull(); // no fee: the old default false meant nothing
    expect(await vat(d)).toBeNull();

    // Every other column of venue_details is byte-for-byte what it was.
    const after = await db.query("select * from venue_details order by vendor_id");
    expect(after.rows.length).toBe(before.rows.length);
    for (const [index, row] of after.rows.entries()) {
      const { fee_includes_vat: _a, ...rest } = row as Record<string, unknown>; // eslint-disable-line @typescript-eslint/no-unused-vars
      const { fee_includes_vat: _b, ...original } = before.rows[index] as Record<string, unknown>; // eslint-disable-line @typescript-eslint/no-unused-vars
      expect(rest).toEqual(original);
    }
    expect((await db.query("select count(*)::int as n from vendors")).rows[0]).toEqual({ n: 4 });
  });

  it("enforces the new vocabulary afterwards", async () => {
    const db = await createDatabase();
    const { rows } = await db.query<{ id: string }>("insert into vendors (category, name) values ('venue', 'x') returning id");
    await db.query("insert into venue_profile (vendor_id) values ($1)", [rows[0].id]);
    for (const value of ["welcome", "limited", "not_allowed", "unknown"]) {
      await db.query("update venue_profile set dog_policy = $1, dog_accommodation = $1 where vendor_id = $2", [value, rows[0].id]);
    }
    await expect(db.query("update venue_profile set dog_policy = 'allowed_all_day' where vendor_id = $1", [rows[0].id])).rejects.toThrow();
    await expect(db.query("update venue_profile set dog_accommodation = 'maybe' where vendor_id = $1", [rows[0].id])).rejects.toThrow();
  });
});
