import logger from "../../../lib/Logger.mjs";

import DDBCompanionMixin from "../DDBCompanionMixin.mjs";
import DDBMonsterFactory from "../../DDBMonsterFactory.js";


export async function getPhantomSteed({
  ddbParser, // this,
  document, // this.data,
  raw, // this.ddbDefinition.description,
  text, // this.data.system.description,
} = {}) {

  logger.verbose("getPhantomSteed", {
    ddbParser,
    document,
    raw,
    text,
  });

  const creatures = [
    {
      name: "Riding Horse",
      source: "2014",
      is2014: true,
      ddbId: "16997",
    },
    {
      name: "Riding Horse",
      source: "2024",
      is2014: false,
      ddbId: "4775839",
    },
  ].filter((m) => m.is2014 === ddbParser.is2014);

  const result = {};


  const monsterFactory = new DDBMonsterFactory();
  const ids = creatures
    .map((m) => parseInt(m.ddbId));
  await monsterFactory.fetchDDBMonsterSourceData({ ids });
  const monsterResults = await monsterFactory.parse();

  for (const data of creatures) {

    let stub = monsterResults.actors.find((m) =>
      m.name === data.name
      && m.system.source?.rules === data.source,
    );

    if (!stub) continue;

    stub.system.attributes = {
      movement: {
        walk: 100,
      },
      hp: {
        value: 1,
        max: 1,
      },
    };

    stub.name = "Phantom Steed";
    stub.prototypeToken.name = "Phantom Steed";

    stub = await DDBCompanionMixin.addEnrichedImageData(stub);

    if (!stub) continue;

    result[`PhantomSteed${data.source}`] = {
      name: "Phantom Steed",
      version: "1",
      required: null,
      isJB2A: false,
      needsJB2A: false,
      needsJB2APatreon: false,
      folderName: `Phantom Steed`,
      data: stub,
    };

  }

  logger.debug("Phantom Steed result", result);
  return result;
}
