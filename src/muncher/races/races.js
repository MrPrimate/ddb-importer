import logger from "../../logger.js";
import utils from "../../utils.js";
import { getImagePath, getCompendiumLabel, getCompendiumItems, updateCompendium, srdFiddling, munchNote } from "../import.js";

const RACE_TEMPLATE = {
  "name": "",
  "type": "feat",
  "data": {
    "description": {
      "value": "",
      "chat": "",
      "unidentified": ""
    },
    "source": "",
  },
  "sort": 2600000,
  "flags": {
    "ddbimporter": {},
  },
  "img": null
};

function buildBase(data) {
  let result = JSON.parse(JSON.stringify(RACE_TEMPLATE));

  result.name = (data.fullName) ? data.fullName : data.name;
  result.data.description.value += `${data.description}\n\n`;

  result.flags.ddbimporter = {
    entityRaceId: data.entityRaceId,
  }

  return result;
}

function buildRace(race, compendiumRacialTraits, compendiumLabel)  {
  console.warn("Race build started");
  let result = buildBase(race);

  // const racialFeaturesMock = race.racialFeatures.map((feature) => {
  //   return { name: feature.name, data: {}, flags: {}, img: null};
  // })

  // const compendiumLabel = getCompendiumLabel("races");
  // const compendiumRacialTraits = await getCompendiumItems(racialFeaturesMock, "races", compendiumLabel);

  race.racialTraits.forEach((feature) => {
    const featureMatch = compendiumRacialTraits.find((match) => feature.name === match.name && match.flags.ddbimporter && match.flags.ddbimporter.entityRaceId === feature.entityRaceId);
    const title = (featureMatch) `<p><b>${feature.name}</b> @Compendium[${compendiumLabel}.${featureMatch._id}]{${feature.name}}</p>`
    result.data.description.value += `${title}\n${feature.description}\n\n`;
  });

  if (race.portraitAvatarUrl) {
    result.img = getImagePath(data.portraitAvatarUrl, "race", data.name);
  } else if (avatarUrl) {
    result.img = getImagePath(data.avatarUrl, "race", data.name);
  } else if (race.largeAvatarUrl) {
    result.img = getImagePath(data.largeAvatarUrl, "race", data.name);
  }

  result.flags.ddbimporter['avatarUrl'] = data.avatarUrl;
  result.flags.ddbimporter['largeAvatarUrl'] = data.largeAvatarUrl;
  result.flags.ddbimporter['portraitAvatarUrl'] = data.portraitAvatarUrl;


  return result;
}

function getRacialTrait(race) {
  console.warn("Race trait build started");

  let result = buildBase(race);

  result.flags.ddbimporter['spellListIds'] = race.spellListIds;
  result.flags.ddbimporter['definitionKey'] = race.definitionKey;

  return result;
}

export async function getRaces(data) {
  console.warn("get races started");
  const updateBool = game.settings.get("ddb-importer", "munching-policy-update-existing");

  let races = [];
  let racialFeatures = [];

  console.log(data);

  data.forEach((race) => {
    console.log(race);
    race.racialTraits.forEach((trait) => {
      console.log(trait.definition.name)
      if (!trait.definition.hideInSheet) {
        const parsedTrait = getRacialTrait(trait.definition);
        racialFeatures.push(parsedTrait);
      }
    });
  });

  console.log("Racial features");
  console.log(racialFeatures);

  const fiddledRacialFeatures = await srdFiddling(racialFeatures, "races");
  munchNote(`Importing ${fiddledRacialFeatures.length} traits!`, true);
  await updateCompendium("races", { races: fiddledRacialFeatures }, updateBool);

  const compendiumLabel = getCompendiumLabel("races");
  const compendiumRacialTraits = await getCompendiumItems(racialFeatures, "races", compendiumLabel);

  data.forEach((race) => {
    const builtRace = buildRace(race, compendiumRacialTraits, compendiumLabel);
    races.push(builtRace);
  });

  console.log(races);

  const fiddledRaces = await srdFiddling(races, "races");
  munchNote(`Importing ${fiddledRaces.length} races!`, true);

  await updateCompendium("races", { races: fiddledRaces }, updateBool);

  return races.concat(racialFeatures);
}
