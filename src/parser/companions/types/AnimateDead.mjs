import logger from "../../../lib/Logger.mjs";
import DDBMonsterFactory from "../../DDBMonsterFactory.js";


export async function getAnimateDead({
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
      name: "Skeleton",
      source: "2014",
      is2014: true,
      ddbId: "17015",
    },
    {
      name: "Zombie",
      source: "2014",
      is2014: true,
      ddbId: "17077",
    },
    {
      name: "Skeleton",
      source: "2024",
      is2014: false,
      ddbId: "4775841",
    },
    {
      name: "Zombie",
      source: "2024",
      is2014: false,
      ddbId: "4775851",
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

    result[`Animated${data.name}${data.source}`] = {
      name: data.name,
      version: "1",
      required: null,
      isJB2A: false,
      needsJB2A: false,
      needsJB2APatreon: false,
      folderName: `Animate Dead`,
      data: stub,
    };

  }

  logger.verbose("Animate Dead result", result);
  return result;
}
