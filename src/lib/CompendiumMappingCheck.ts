// Pure helpers for keeping the entity-*-compendium settings one-to-one. No Foundry globals here so
// the planning rules can be unit tested; CompendiumHelper gathers the pack facts and applies the plan.

/**
 * Groups settings that point at the same non-empty compendium id.
 * @param {Record<string, string>} values setting key -> compendium id
 * @returns {ICompendiumDuplicateGroup[]} one group per compendium id used by more than one setting
 */
export function findDuplicateMappings(values: Record<string, string | null | undefined>): ICompendiumDuplicateGroup[] {
  const byPack = new Map<string, string[]>();
  for (const [setting, value] of Object.entries(values)) {
    if (!value) continue;
    const settings = byPack.get(value) ?? [];
    settings.push(setting);
    byPack.set(value, settings);
  }
  return Array.from(byPack.entries())
    .filter(([, settings]) => settings.length > 1)
    .map(([packId, settings]) => ({ packId, settings }));
}

/**
 * Works out how to split settings that share a compendium.
 *
 * The setting whose own default DDB compendium is the shared pack keeps it. Every other setting in
 * the group moves to its own default DDB compendium, provided that exists and no other setting
 * already uses it. Groups sharing a compendium DDB Importer did not create are left for the user,
 * as there is no way to tell which setting the pack was meant for.
 * @param {object} options
 * @param {ICompendiumMappingEntry[]} options.entries every compendium setting with its default DDB pack
 * @param {Set<string>} options.ddbPackIds ids of existing compendiums DDB Importer created
 * @returns {ICompendiumMappingPlan} the setting changes to apply and the settings that need the user
 */
export function planMappingFix({ entries, ddbPackIds }: {
  entries: ICompendiumMappingEntry[];
  ddbPackIds: Set<string>;
}): ICompendiumMappingPlan {
  const plan: ICompendiumMappingPlan = { changes: [], unresolved: [] };
  const bySetting = new Map(entries.map((entry) => [entry.setting, entry]));
  const values = Object.fromEntries(entries.map((entry) => [entry.setting, entry.value]));
  const claimed = new Set(entries.map((entry) => entry.value).filter((value) => !!value));

  for (const group of findDuplicateMappings(values)) {
    const members = group.settings.map((setting) => bySetting.get(setting)!);
    const titles = (exclude: string) => members.filter((m) => m.setting !== exclude).map((m) => m.title);

    if (!ddbPackIds.has(group.packId)) {
      for (const member of members) {
        plan.unresolved.push({
          setting: member.setting,
          title: member.title,
          packId: group.packId,
          reason: "non-ddb-pack",
          sharedWith: titles(member.setting),
        });
      }
      continue;
    }

    for (const member of members) {
      if (member.defaultPackId === group.packId) continue;
      const target = member.defaultPackId;
      if (target && !claimed.has(target)) {
        plan.changes.push({ setting: member.setting, title: member.title, from: group.packId, to: target });
        claimed.add(target);
        continue;
      }
      plan.unresolved.push({
        setting: member.setting,
        title: member.title,
        packId: group.packId,
        reason: target ? "default-in-use" : "no-default",
        sharedWith: titles(member.setting),
      });
    }
  }

  // with no owner in a group, moving the others can leave a single unresolved setting holding the
  // pack alone, which is no longer a clash
  for (const change of plan.changes) values[change.setting] = change.to;
  const stillShared = new Set(findDuplicateMappings(values).flatMap((group) => group.settings));
  plan.unresolved = plan.unresolved.filter((entry) => stillShared.has(entry.setting));

  return plan;
}
