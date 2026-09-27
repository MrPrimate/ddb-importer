// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CompendiumHelper } from "../../../src/lib/_module";
import DDBItem from "../../../src/parser/item/DDBItem";
import { ensureItemSpellsInCompendium } from "../../../src/parser/character/itemSpells";

// An item spell the spells compendium lacks must not fail a character import: the item parse keeps
// the spell on the character's spell list, so the player is warned what to munch instead.

const itemSpell = {
  name: "Fireball",
  flags: { ddbimporter: { definitionId: 2001, dndbeyond: { lookupName: "Wand of Fireballs" } } },
} as unknown as I5eSpellItem;

const ddb = { character: { spells: { item: [] } } } as unknown as IDDBData;

describe("ensureItemSpellsInCompendium", () => {
  const originalIsGM = (globalThis as any).game.user?.isGM;

  beforeEach(() => {
    vi.spyOn(DDBItem, "prepareSpellCompendiumIndex").mockResolvedValue(undefined as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    (globalThis as any).game.user.isGM = originalIsGM;
  });

  it("warns a player about spells the compendium lacks and lets the import continue", async () => {
    (globalThis as any).game.user.isGM = false;
    vi.spyOn(CompendiumHelper, "getCompendiumType").mockReturnValue({ index: [] } as any);
    const warn = vi.spyOn(ui.notifications, "warn");
    await expect(ensureItemSpellsInCompendium(ddb, [itemSpell])).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("Fireball"), { permanent: true });
  });

  it("warns and continues when no spells compendium is configured", async () => {
    vi.spyOn(CompendiumHelper, "getCompendiumType").mockReturnValue(null as any);
    const warn = vi.spyOn(ui.notifications, "warn");
    await expect(ensureItemSpellsInCompendium(ddb, [itemSpell])).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("No spells compendium"), { permanent: true });
  });

  it("does nothing when the compendium already holds the spell", async () => {
    vi.spyOn(CompendiumHelper, "getCompendiumType").mockReturnValue({
      index: [{ flags: { ddbimporter: { definitionId: 2001 } } }],
    } as any);
    const warn = vi.spyOn(ui.notifications, "warn");
    await ensureItemSpellsInCompendium(ddb, [itemSpell]);
    expect(warn).not.toHaveBeenCalled();
  });
});
