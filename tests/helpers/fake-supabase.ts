import type { PGlite } from "@electric-sql/pglite";

type Filter = { column: string; op: "=" | "<>" | "in"; value: unknown };
type Row = Record<string, unknown>;
type Result = { data: unknown; error: { message: string } | null };

/**
 * The slice of the Supabase query builder this app uses (select / insert /
 * upsert / update / delete with eq, neq, in, order, limit, single,
 * maybeSingle), executed as SQL on PGlite. It lets tests run the real
 * non-mock code paths against the real schema, constraints included.
 */
export function createFakeSupabase(db: PGlite) {
  const jsonColumns = new Map<string, Set<string>>();

  async function jsonColumnsOf(table: string): Promise<Set<string>> {
    if (!jsonColumns.has(table)) {
      const { rows } = await db.query<{ column_name: string }>(
        "select column_name from information_schema.columns where table_schema='public' and table_name=$1 and data_type in ('json','jsonb')",
        [table],
      );
      jsonColumns.set(table, new Set(rows.map((row) => row.column_name)));
    }
    return jsonColumns.get(table)!;
  }

  const primaryKeys = new Map<string, string>();

  /** PostgREST upserts conflict on the table's primary key unless told otherwise. */
  async function primaryKeyOf(table: string): Promise<string> {
    if (!primaryKeys.has(table)) {
      const { rows } = await db.query<{ attname: string }>(
        `select a.attname from pg_index i
         join pg_attribute a on a.attrelid = i.indrelid and a.attnum = any(i.indkey)
         where i.indrelid = $1::regclass and i.indisprimary`,
        [`public.${table}`],
      );
      primaryKeys.set(table, rows.map((row) => row.attname).join(", "));
    }
    return primaryKeys.get(table)!;
  }

  class Builder implements PromiseLike<Result> {
    private op: "select" | "insert" | "upsert" | "update" | "delete" = "select";
    private columns = "*";
    private returning = false;
    private filters: Filter[] = [];
    private orders: { column: string; ascending: boolean }[] = [];
    private max: number | null = null;
    private mode: "many" | "single" | "maybe" = "many";
    private rows: Row[] = [];
    private values: Row = {};
    private conflict: string | null = null;

    constructor(private table: string) {}

    select(columns = "*") {
      this.columns = columns;
      if (this.op !== "select") this.returning = true;
      return this;
    }
    insert(rows: Row | Row[]) {
      this.op = "insert";
      this.rows = Array.isArray(rows) ? rows : [rows];
      return this;
    }
    upsert(rows: Row | Row[], options?: { onConflict?: string }) {
      this.op = "upsert";
      this.rows = Array.isArray(rows) ? rows : [rows];
      this.conflict = options?.onConflict ?? null;
      return this;
    }
    update(values: Row) {
      this.op = "update";
      this.values = values;
      return this;
    }
    delete() {
      this.op = "delete";
      return this;
    }
    eq(column: string, value: unknown) {
      this.filters.push({ column, op: "=", value });
      return this;
    }
    neq(column: string, value: unknown) {
      this.filters.push({ column, op: "<>", value });
      return this;
    }
    in(column: string, value: unknown[]) {
      this.filters.push({ column, op: "in", value });
      return this;
    }
    order(column: string, options?: { ascending?: boolean }) {
      this.orders.push({ column, ascending: options?.ascending ?? true });
      return this;
    }
    limit(count: number) {
      this.max = count;
      return this;
    }
    single() {
      this.mode = "single";
      return this;
    }
    maybeSingle() {
      this.mode = "maybe";
      return this;
    }

    then<TResult1 = Result, TResult2 = never>(
      onfulfilled?: ((value: Result) => TResult1 | PromiseLike<TResult1>) | null,
      onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
    ): PromiseLike<TResult1 | TResult2> {
      return this.execute().then(onfulfilled, onrejected);
    }

    private where(params: unknown[]): string {
      if (this.filters.length === 0) return "";
      const clauses = this.filters.map((filter) => {
        if (filter.op === "in") {
          params.push(filter.value);
          return `${filter.column} = any($${params.length})`;
        }
        params.push(filter.value);
        return `${filter.column} ${filter.op} $${params.length}`;
      });
      return ` where ${clauses.join(" and ")}`;
    }

    private async execute(): Promise<Result> {
      try {
        const json = await jsonColumnsOf(this.table);
        const params: unknown[] = [];
        const bind = (column: string, value: unknown) => {
          let param = value;
          if (value !== null && typeof value === "object" && !(value instanceof Date)) {
            // jsonb takes JSON text; Postgres arrays (e.g. enum[]) take an array literal.
            param = json.has(column)
              ? JSON.stringify(value)
              : Array.isArray(value)
                ? `{${value.map((item) => `"${String(item).replace(/(["\\])/g, "\\$1")}"`).join(",")}}`
                : value;
          }
          params.push(param);
          return `$${params.length}`;
        };
        let sql: string;

        if (this.op === "select") {
          sql = `select ${this.columns} from ${this.table}${this.where(params)}`;
          if (this.orders.length) sql += ` order by ${this.orders.map((o) => `${o.column} ${o.ascending ? "asc" : "desc"}`).join(", ")}`;
          if (this.max !== null) sql += ` limit ${this.max}`;
        } else if (this.op === "insert" || this.op === "upsert") {
          const keys = [...new Set(this.rows.flatMap((row) => Object.keys(row)))];
          const tuples = this.rows.map(
            (row) => `(${keys.map((key) => (key in row ? bind(key, row[key]) : "default")).join(", ")})`,
          );
          sql = `insert into ${this.table} (${keys.join(", ")}) values ${tuples.join(", ")}`;
          if (this.op === "upsert") {
            const target = this.conflict ?? (await primaryKeyOf(this.table));
            const targetColumns = target.split(",").map((column) => column.trim());
            const updates = keys.filter((key) => !targetColumns.includes(key)).map((key) => `${key} = excluded.${key}`);
            sql += ` on conflict (${target}) do ${updates.length ? `update set ${updates.join(", ")}` : "nothing"}`;
          }
          if (this.returning) sql += ` returning ${this.columns}`;
        } else if (this.op === "update") {
          const keys = Object.keys(this.values);
          const sets = keys.map((key) => `${key} = ${bind(key, this.values[key])}`);
          sql = `update ${this.table} set ${sets.join(", ")}${this.where(params)}`;
          if (this.returning) sql += ` returning ${this.columns}`;
        } else {
          sql = `delete from ${this.table}${this.where(params)}`;
        }

        const { rows } = await db.query<Row>(sql, params);
        const returned = this.op === "select" || this.returning ? rows : null;
        if (returned === null) return { data: null, error: null };
        if (this.mode === "many") return { data: returned, error: null };
        if (returned.length === 1) return { data: returned[0], error: null };
        if (returned.length === 0 && this.mode === "maybe") return { data: null, error: null };
        return { data: null, error: { message: `Expected one row from ${this.table}, got ${returned.length}` } };
      } catch (error) {
        return { data: null, error: { message: error instanceof Error ? error.message : String(error) } };
      }
    }
  }

  return {
    from: (table: string) => new Builder(table),
    storage: {
      from: () => {
        throw new Error("Storage is not available in tests");
      },
    },
  };
}
