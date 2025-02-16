import logger from "../../../lib/Logger.mjs";
import DDBMonsterFactory from "../../DDBMonsterFactory.js";


export async function getFingerOfDeath({
  ddbParser, // this,
  document, // this.data,
  raw, // this.ddbDefinition.description,
  text, // this.data.system.description,
} = {}) {

  logger.verbose("getFingerOfDeath", {
    ddbParser,
    document,
    raw,
    text,
  });

  const animated = [
    {
      name: "Zombie",
      source: "2014",
      is2014: true,
      ddbId: "17077",
    },
    {
      name: "Zombie",
      source: "2024",
      is2014: false,
      ddbId: "4775851",
    },
  ].filter((m) => m.is2014 === ddbParser.is2014);

  const result = {};


  const monsterFactory = new DDBMonsterFactory();
  const ids = animated
    .map((m) => parseInt(m.ddbId));
  await monsterFactory.fetchDDBMonsterSourceData({ ids });
  const monsterResults = await monsterFactory.parse();


  for (const data of animated) {

    let stub = monsterResults.actors.find((m) =>
      m.name === data.name
      && m.system.source?.rules === data.source,
    );

    if (!stub) continue;

    result[`FingerOfDeath${data.name}${data.source}`] = {
      name: data.name,
      version: "1",
      required: null,
      isJB2A: false,
      needsJB2A: false,
      needsJB2APatreon: false,
      folderName: `Finger of Death`,
      data: stub,
    };

  }

  logger.verbose("Finger of Death result", result);
  return result;
}
