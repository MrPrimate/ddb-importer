import logger from "../../../lib/Logger";
import PatreonHelper from "../../../lib/PatreonHelper";
import DDBMonsterFactory from "../../DDBMonsterFactory";

/**
 * Builds summons from D&D Beyond stat blocks fetched by id. Book stat blocks outside the SRD are
 * served by id only to Patreon supporters, so anyone else gets no summons.
 */
export async function getPatreonMonsterSummons(
  creatures: { key: string; name: string; ddbId: number }[],
  folderName: string,
): Promise<ICompanionResult> {
  const tiers = await PatreonHelper.checkPatreon({ cacheBust: false });
  if (!tiers.all && !tiers.custom) return {};

  const monsterFactory = new DDBMonsterFactory();
  await monsterFactory.fetchDDBMonsterSourceData({ ids: creatures.map((creature) => creature.ddbId) });
  const monsterResults = await monsterFactory.parse();

  const result: ICompanionResult = {};
  for (const creature of creatures) {
    const stub = monsterResults.actors.find((actor) => Number(actor.flags?.ddbimporter?.id) === creature.ddbId);
    if (!stub) continue;
    result[creature.key] = {
      name: creature.name,
      version: "1",
      required: null,
      isJB2A: false,
      needsJB2A: false,
      needsJB2APatreon: false,
      folderName,
      data: stub,
    };
  }

  logger.verbose(`${folderName} summons result`, { result });
  return result;
}
