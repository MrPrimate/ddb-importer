import { logger } from "../lib/_module";
import DDBMonsterFactory from "../parser/DDBMonsterFactory";
import { splitMonsterBiography } from "../parser/monster/biographyText";

let importQueue: InstanceType<typeof foundry.utils.Semaphore> | null = null;

/**
 * Imports one monster into the monster compendium from its D&D Beyond page, sent by the DDBI
 * Utilities browser extension. Always a forced import: a monster already in the compendium is
 * updated in place, a missing one is created.
 *
 * Many 2024 Monster Manual entries have no `characteristicsDescription` / `lairDescription` in the
 * API data although the page shows them, so the page's biography block is patched into those
 * fields before parsing, which also sends the lair section through the lair parser:
 * - `biography: "replace"` always uses the page text ("Send biography")
 * - `biography: "fill"` only fills fields DDB left empty ("Import/reimport monster")
 * @param payload `monsterId` (the id in the page URL), `name`, `html` (the biography block, may be
 * empty) and `biography` ("replace" or "fill")
 * @returns the outcome shown in the extension popup
 */
export async function importMonsterFromPage(payload: Record<string, unknown>): Promise<{ success: boolean; message: string }> {
  if (!game.user.isGM) {
    return { success: false, message: "Open Foundry as a GM to update compendium monsters." };
  }
  const monsterId = Number(payload.monsterId);
  const name = typeof payload.name === "string" && payload.name !== "" ? payload.name : `monster ${monsterId}`;
  const replace = payload.biography === "replace";
  if (!Number.isInteger(monsterId) || monsterId <= 0) {
    return { success: false, message: "The page did not give a valid monster id." };
  }
  const { biography, lair } = splitMonsterBiography(typeof payload.html === "string" ? payload.html : "");
  if (replace && biography === "") {
    return { success: false, message: "This monster page has no biography to import." };
  }

  const added = { biography: false, lair: false };
  const sourcePatch = (monster: IDDBMonsterSourceData): Partial<IDDBMonsterSourceData> => {
    const patch: Partial<IDDBMonsterSourceData> = {};
    if (biography !== "" && (replace || (monster.characteristicsDescription ?? "").trim() === "")) {
      patch.characteristicsDescription = biography;
      added.biography = true;
    }
    if (lair !== "" && (replace || (monster.lairDescription ?? "").trim() === "")) {
      patch.lairDescription = lair;
      patch.hasLair = true;
      added.lair = true;
    }
    return patch;
  };

  importQueue ??= new foundry.utils.Semaphore(1);
  return importQueue.add(async () => {
    ui.notifications.info(`Importing ${name} from D&D Beyond...`);
    const factory = new DDBMonsterFactory({
      forceUpdate: true,
      sourcePatches: { [monsterId]: sourcePatch },
    });
    const result = await factory.processIntoCompendium([monsterId]);
    const actors = Array.isArray(result) ? result.filter(Boolean) : [];
    if (actors.length === 0) {
      logger.warn(`Monster page import for ${monsterId} produced no compendium monster`, { result });
      return { success: false, message: `D&D Beyond returned no monster ${monsterId}. Check the monster is in a source you can access.` };
    }
    const importedName = actors[0]?.name ?? name;
    const pageText = [added.biography ? "biography" : "", added.lair ? "lair" : ""].filter(Boolean).join(" and ");
    const message = pageText
      ? `Imported ${importedName} into the monster compendium with its ${pageText} from the D&D Beyond page.`
      : `Imported ${importedName} into the monster compendium.`;
    ui.notifications.info(message);
    return { success: true, message };
  }) as Promise<{ success: boolean; message: string }>;
}
