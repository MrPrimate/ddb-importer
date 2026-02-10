import logger from "../../../lib/Logger.mjs";
import DDBMonsterFactory from "../../DDBMonsterFactory.js";


export async function getAccursedSpecter({
  ddbParser, // this,
  document, // this.data,
  raw, // this.ddbDefinition.description,
  text, // this.data.system.description,
} = {}) {

  logger.verbose("getAnimateDead", {
    ddbParser,
    document,
    raw,
    text,
  });

  const animated = [
    {
      name: "Specter",
      source: "2014",
      is2014: true,
      ddbId: "17017",
    },
    {
      name: "Specter",
      source: "2024",
      is2014: false,
      ddbId: "5195210",
    },
  ].filter((m) => m.is2014 === ddbParser.is2014);

  const result = {};

  const ids = animated.map((m) => parseInt(m.ddbId));
  const monsterFactory = new DDBMonsterFactory();
  await monsterFactory.fetchDDBMonsterSourceData({ ids });
  const monsterResults = await monsterFactory.parse();

  for (const data of animated) {

    let stub = monsterResults.actors.find((m) =>
      m.name === data.name
      && m.system.source?.rules === data.source,
    );

    if (!stub) continue;

    result[`${data.name}${data.source}`] = {
      name: data.name,
      version: "1",
      required: null,
      isJB2A: false,
      needsJB2A: false,
      needsJB2APatreon: false,
      folderName: `Accursed Specter`,
      data: stub,
    };

  }

  logger.verbose("Accursed Specter result", result);
  return result;
}
