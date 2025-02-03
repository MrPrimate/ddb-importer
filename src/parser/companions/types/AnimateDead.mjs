import logger from "../../../lib/Logger.mjs";
import DDBMonsterFactory from "../../DDBMonsterFactory.js";
import DDBCompanionMixin from "../DDBCompanionMixin.mjs";
import { SUMMONS_ACTOR_STUB } from "./_data.mjs";


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
      ddbId: "17015",
    },
    {
      name: "Zombie",
      source: "2014",
      ddbId: "17077",
    },
    {
      name: "Skeleton",
      source: "2024",
      ddbId: "4775841",
    },
    {
      name: "Zombie",
      source: "2024",
      ddbId: "4775851",
    },
  ];

  const result = {};


  const monsterFactory = new DDBMonsterFactory();
  await monsterFactory.fetchDDBMonsterSourceData({ ids: animated.map((m) => m.ddbId) });
  const monsterResults = await monsterFactory.parse();

  console.warn(monsterResults);

  for (const data of animated) {

    let stub = monsterResults.actors.find((m) =>
      m.name === data.name
      && m.system.source?.rules === data.source,
    );

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
