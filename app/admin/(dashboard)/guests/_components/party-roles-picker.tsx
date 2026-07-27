"use client";

import { useState } from "react";
import {
  WEDDING_PARTY_ROLE_LABELS,
  WEDDING_PARTY_ROLES,
  type WeddingPartyRole,
} from "@/lib/guests/types";
import { RoleBadge } from "./role-badge";

export function PartyRolesPicker({
  defaultRoles = [],
}: {
  defaultRoles?: WeddingPartyRole[];
}) {
  const [selected, setSelected] = useState<WeddingPartyRole[]>(defaultRoles);
  const available = WEDDING_PARTY_ROLES.filter((role) => !selected.includes(role));

  return (
    <div className="flex flex-col gap-2">
      {selected.map((role) => (
        <input key={role} type="hidden" name="partyRoles" value={role} />
      ))}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((role) => (
            <RoleBadge
              key={role}
              role={role}
              onRemove={() => setSelected((roles) => roles.filter((r) => r !== role))}
            />
          ))}
        </div>
      )}
      {available.length > 0 && (
        <select
          value=""
          onChange={(event) => {
            const role = event.target.value as WeddingPartyRole;
            if (role) setSelected((roles) => [...roles, role]);
          }}
          className="input"
        >
          <option value="">Add a role…</option>
          {available.map((role) => (
            <option key={role} value={role}>
              {WEDDING_PARTY_ROLE_LABELS[role]}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
