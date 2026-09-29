import logger from "../../../lib/Logger";
import DDBMonsterFactory from "../../DDBMonsterFactory";
import { vengefulServantKey, vengefulServantsFor } from "./_vengefulServants";

/**
 * Wretched Bloodline's Vengeful Summons: the servants are ordinary stat blocks, fetched from D&D
 * Beyond by id and parsed, so they land in the summons compendium whether or not they were munched.
 */
export async function getVengefulSummons({
  ddbParser,
  document,
  raw,
  text,
}: ICompanionData): Promise<ICompanionResult> {

  logger.verbose("getVengefulSummons", {
    ddbParser,
    document,
    raw,
    text,
  });

  const rules = ddbParser.is2014 ? "2014" : "2024";
  const servants = vengefulServantsFor(ddbParser).map((servant) => ({
    name: servant.name,
    ddbId: ddbParser.is2014 ? servant.ddbId2014 : servant.ddbId2024,
  }));

  const result: ICompanionResult = {};

  const monsterFactory = new DDBMonsterFactory();
  await monsterFactory.fetchDDBMonsterSourceData({ ids: servants.map((servant) => servant.ddbId) });
  const monsterResults = await monsterFactory.parse();

  for (const servant of servants) {
    const stub = monsterResults.actors.find((m) =>
      m.name === servant.name
      && m.system.source?.rules === rules,
    );

    if (!stub) continue;

    result[vengefulServantKey(servant.name, rules)] = {
      name: servant.name,
      version: "1",
      required: null,
      isJB2A: false,
      needsJB2A: false,
      needsJB2APatreon: false,
      folderName: "Vengeful Summons",
      data: stub,
    };
  }

  logger.verbose("Vengeful Summons result", result);
  return result;
}
