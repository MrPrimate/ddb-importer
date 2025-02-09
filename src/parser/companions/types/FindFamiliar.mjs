import { CompendiumHelper } from "../../../lib/_module.mjs";

import logger from "../../../lib/Logger.mjs";
import DDBMonsterFactory from "../../DDBMonsterFactory.js";

const animals2014 = [
  {
    name: "Bat",
    id: 16802,
  },
  {
    name: "Cat",
    id: 16820,
  },
  {
    name: "Crab",
    id: 16833,
  },
  {
    name: "Quipper",
    id: 16989,
  },
  {
    name: "Frog",
    id: 16866,
  },
  {
    name: "Hawk",
    id: 16920,
  },
  {
    name: "Lizard",
    id: 16945,
  },
  {
    name: "Octopus",
    id: 16968,
  },
  {
    name: "Owl",
    id: 16974,
  },
  {
    name: "Poisonous Snake",
    id: 16982,
  },
  {
    name: "Rat",
    id: 16991,
  },
  {
    name: "Raven",
    id: 16992,
  },
  {
    name: "Sea Horse",
    id: 17009,
  },
  {
    name: "Spider",
    id: 17018,
  },
  {
    name: "Weasel",
    id: 17052,
  },
];

const pactFamiliars2014 = [
  {
    name: "Imp",
    id: 16933,
  },
  {
    name: "Pseudodragon",
    id: 16986,
  },
  {
    name: "Quasit",
    id: 16988,
  },
  {
    name: "Sprite",
    id: 17020,
  },
];

const pactFamiliars2024 = [
  {
    name: "Imp",
    id: 4775825,
  },
  {
    name: "Pseudodragon",
    id: 4775834,
  },
  {
    name: "Quasit",
    id: 4775835,
  },
  {
    name: "Skeleton",
    id: 4775841,
  },
  {
    name: "Slaad Tadpole",
    id: 4775842,
  },
  {
    name: "Sphinx of Wonder",
    id: 4775843,
  },
  {
    name: "Sprite",
    id: 4775845,
  },
  {
    name: "Venomous Snake",
    id: 4775847,
  },
];

const animals2024 = [
  {
    name: "Bat",
    id: 4775803,
  },
  {
    name: "Cat",
    id: 4775808,
  },
  {
    name: "Crab",
    id: 4775810,
  },
  {
    name: "Frog",
    id: 4775816,
  },
  {
    name: "Hawk",
    id: 4775824,
  },
  {
    name: "Lizard",
    id: 4775827,
  },
  {
    name: "Octopus",
    id: 4775830,
  },
  {
    name: "Owl",
    id: 4775831,
  },
  {
    name: "Rat",
    id: 4775836,
  },
  {
    name: "Raven",
    id: 4775837,
  },
  {
    name: "Spider",
    id: 4775844,
  },
  {
    name: "Weasel",
    id: 4775849,
  },
];

export async function getFindFamiliarActivityData(activity, options) {
  const is2014 = options.is2014;
  const rules = is2014 ? "2014" : "2024";

  const monsterFactory = new DDBMonsterFactory();
  const baseMap = is2014 ? animals2014 : animals2024;
  const packMap = is2014 ? pactFamiliars2014 : pactFamiliars2024;

  const isPactActivity = activity.name === "Find Familiar (Expanded Options)";
  const isPactSpell = foundry.utils.getProperty(options.originDocument, "flags.ddbimporter.dndbeyond.lookupName") === "Pact of the Chain";
  const isPactFeature = foundry.utils.getProperty(options.originDocument, "flags.ddbimporter.originalName").includes("Pact of the Chain");

  const mapInUse = isPactActivity && (isPactSpell || isPactFeature) ? packMap : baseMap;

  await monsterFactory.processIntoCompendium(mapInUse.map((i) => i.id));

  const ddbCompendium = CompendiumHelper.getCompendiumType("monster", false);
  await ddbCompendium?.getIndex({ fields: ["name", "system.source.rules"] });

  const profiles = [];

  for (const familiar of mapInUse) {
    const i = ddbCompendium?.index.find((i) => i.name === familiar.name && i.system.source.rules === rules);
    if (i) profiles.push({
      name: familiar.name,
      uuid: i.uuid,
    });
  }

  const profilesChoice = is2014 || isPactActivity
    ? profiles
    : [
      {
        count: "1",
        cr: "0",
        name: "CR 0 Beast",
        types: ["beast"],
      },
    ];

  // console.warn("data", {
  //   baseMap,
  //   packMap,
  //   isPactSpell,
  //   isPactFeature,
  //   isPactActivity,
  //   profiles,
  //   profilesChoice,
  //   mapInUse,
  //   options,
  //   activity,
  // });

  const activityData = {
    creatureTypes: ["celestial", "fey", "fiend"],
    profiles: profilesChoice,
    creatureSizes: [],
    match: {
      attacks: false,
      proficiency: false,
      saves: false,
    },
    summon: {
      identifier: "",
      mode: is2014 || isPactActivity ? "" : "cr",
      prompt: true,
    },
    bonuses: {
      ac: "",
      hp: "",
      attackDamage: "",
      saveDamage: "",
      healing: "",
    },
  };

  logger.verbose("Final find familiar Activity Data", activityData);

  return activityData;
}
