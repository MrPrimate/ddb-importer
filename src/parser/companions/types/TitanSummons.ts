import logger from "../../../lib/Logger";
import PatreonHelper from "../../../lib/PatreonHelper";
import DDBMonsterFactory from "../../DDBMonsterFactory";
import { TITANS, titanKey } from "./_titans";

/**
 * Scroll of Titan Summoning: the titans are Monster Manual stat blocks, which the proxy only
 * serves by id to Patreon supporters, so the summons are built only for them.
 */
export async function getTitanSummons({ ddbParser }: ICompanionData): Promise<ICompanionResult> {
  const tiers = await PatreonHelper.checkPatreon({ cacheBust: false });
  if (!tiers.all && !tiers.custom) return {};

  const monsterFactory = new DDBMonsterFactory();
  await monsterFactory.fetchDDBMonsterSourceData({ ids: TITANS.map((titan) => titan.ddbId) });
  const monsterResults = await monsterFactory.parse();

  const result: ICompanionResult = {};
  for (const titan of TITANS) {
    const stub = monsterResults.actors.find((actor) => Number(actor.flags?.ddbimporter?.id) === titan.ddbId);
    if (!stub) continue;
    result[titanKey(titan.name)] = {
      name: titan.name,
      version: "1",
      required: null,
      isJB2A: false,
      needsJB2A: false,
      needsJB2APatreon: false,
      folderName: "Scroll of Titan Summoning",
      data: stub,
    };
  }

  logger.verbose("Titan summons result", { result, item: ddbParser.name });
  return result;
}
