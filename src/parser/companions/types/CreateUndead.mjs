import logger from "../../../lib/Logger.mjs";
import DDBMonsterFactory from "../../DDBMonsterFactory.js";


export async function getCreateUndead({
  ddbParser, // this,
  document, // this.data,
  raw, // this.ddbDefinition.description,
  text, // this.data.system.description,
} = {}) {

  logger.verbose("getCreateUndead", {
    ddbParser,
    document,
    raw,
    text,
  });

  const animated = [
    {
      name: "Ghoul",
      source: "2014",
      is2014: true,
      ddbId: "16872",
    },
    {
      name: "Ghast",
      source: "2014",
      is2014: true,
      ddbId: "16870",
    },
    {
      name: "Wight",
      source: "2014",
      is2014: true,
      ddbId: "17059",
    },
    {
      name: "Mummy",
      source: "2014",
      is2014: true,
      ddbId: "16961",
    },
    {
      name: "Ghoul",
      source: "2024",
      is2014: false,
      ddbId: "5195009",
    },
    {
      name: "Ghast",
      source: "2024",
      is2014: false,
      ddbId: "5195007",
    },
    {
      name: "Wight",
      source: "2024",
      is2014: false,
      ddbId: "5195269",
    },
    {
      name: "Mummy",
      source: "2024",
      is2014: false,
      ddbId: "5195135",
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

    result[`Undead${data.name}${data.source}`] = {
      name: data.name,
      version: "1",
      required: null,
      isJB2A: false,
      needsJB2A: false,
      needsJB2APatreon: false,
      folderName: `Create Undead`,
      data: stub,
    };

  }

  logger.verbose("Create Undead result", result);
  return result;
}
