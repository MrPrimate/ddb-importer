import { CompendiumHelper } from "../../../lib/_module.mjs";

export async function getFindFamiliarActivityData(is2014) {
  const ddbCompendium = CompendiumHelper.getCompendiumType("monster", false);
  await ddbCompendium?.getIndex();

  const activity = {
    "creatureTypes": [
      "celestial",
      "fey",
      "fiend",
    ],
    "profiles": is2014
      ? [
        {
          "name": "Bat",
          "uuid": ddbCompendium?.index.find((i) => i.name === "Bat")?.uuid ?? "Compendium.dnd5e.monsters.Actor.qav2dvMIUiMQCCsy",
        },
        {
          "name": "Cat",
          "uuid": ddbCompendium?.index.find((i) => i.name === "Cat")?.uuid ?? "Compendium.dnd5e.monsters.Actor.hIf83RD3ZVW4Egfi",
        },
        {
          "name": "Crab",
          "uuid": ddbCompendium?.index.find((i) => i.name === "Crab")?.uuid ?? "Compendium.dnd5e.monsters.Actor.8RgUhb31VvjUNZU1",
        },
        {
          "name": "Fish",
          "uuid": ddbCompendium?.index.find((i) => i.name === "Quipper")?.uuid ?? "Compendium.dnd5e.monsters.Actor.nkyCGJ9wXeAZkyyz",
        },
        {
          "name": "Frog",
          "uuid": ddbCompendium?.index.find((i) => i.name === "Frog")?.uuid ?? "Compendium.dnd5e.monsters.Actor.EZgiprHXA2D7Uyb3",
        },
        {
          "name": "Hawk",
          "uuid": ddbCompendium?.index.find((i) => i.name === "Hawk")?.uuid ?? "Compendium.dnd5e.monsters.Actor.fnkPNfIpS62LqOu4",
        },
        {
          "name": "Lizard",
          "uuid": ddbCompendium?.index.find((i) => i.name === "Lizard")?.uuid ?? "Compendium.dnd5e.monsters.Actor.I2x01hzOjVN4NUjf",
        },
        {
          "name": "Octopus",
          "uuid": ddbCompendium?.index.find((i) => i.name === "Octopus")?.uuid ?? "Compendium.dnd5e.monsters.Actor.3UUNbGiG2Yf1ZPxM",
        },
        {
          "name": "Owl",
          "uuid": ddbCompendium?.index.find((i) => i.name === "Owl")?.uuid ?? "Compendium.dnd5e.monsters.Actor.d0prpsGSAorDadec",
        },
        {
          "name": "Poisonous Snake",
          "uuid": ddbCompendium?.index.find((i) => i.name === "Poisonous Snake")?.uuid ?? "Compendium.dnd5e.monsters.Actor.D5rwVIxmfFrdyyxT",
        },
        {
          "name": "Rat",
          "uuid": ddbCompendium?.index.find((i) => i.name === "Rat")?.uuid ?? "Compendium.dnd5e.monsters.Actor.pozQUPTnLZW8epox",
        },
        {
          "name": "Raven",
          "uuid": ddbCompendium?.index.find((i) => i.name === "Raven")?.uuid ?? "Compendium.dnd5e.monsters.Actor.LPdX5YLlwci0NDZx",
        },
        {
          "name": "Sea Horse",
          "uuid": ddbCompendium?.index.find((i) => i.name === "Sea Horse")?.uuid ?? "Compendium.dnd5e.monsters.Actor.FWSDiq9SZsdiBAa8",
        },
        {
          "name": "Spider",
          "uuid": ddbCompendium?.index.find((i) => i.name === "Spider")?.uuid ?? "Compendium.dnd5e.monsters.Actor.28gU50HtG8Kp7uIz",
        },
        {
          "name": "Weasel",
          "uuid": ddbCompendium?.index.find((i) => i.name === "Weasel")?.uuid ?? "Compendium.dnd5e.monsters.Actor.WOdeacKCYVhgLDuN",
        },
      ]
      : [
        {
          "count": "1",
          "cr": "0",
          "name": "CR 0 Beast",
          "types": ["beast"],
        },
      ],
    "creatureSizes": [],
    "match": {
      "attacks": false,
      "proficiency": false,
      "saves": false,
    },
    summon: {
      identifier: "",
      mode: is2014 ? "" : "cr",
      prompt: true,
    },
    "bonuses": {
      "ac": "",
      "hp": "",
      "attackDamage": "",
      "saveDamage": "",
      "healing": "",
    },
  };
  return activity;
}

export const CR_DATA = {
  "Conjure Animals": {
    profiles: [
      {
        "count": "1 * floor((@item.level - 1) / 2)",
        "cr": "2",
        "types": ["beast"],
      },
      {
        "count": "2 * floor((@item.level - 1) / 2)",
        "cr": "1",
        "types": ["beast"],
      },
      {
        "count": "4 * floor((@item.level - 1) / 2)",
        "cr": "0.5",
        "types": ["beast"],
      },
      {
        "count": "8 * floor((@item.level - 1) / 2)",
        "cr": "0.25",
        "types": ["beast"],
      },
    ],
    creatureTypes: ["beast"],
  },
  "Conjure Celestial": {
    profiles: [
      {
        "count": "1",
        "cr": "4",
        "level": {
          "min": null,
          "max": 8,
        },
        "types": ["celestial"],
      },
      {
        "count": "1",
        "cr": "5",
        "level": {
          "min": 9,
          "max": null,
        },
        "types": ["celestial"],
      },
    ],
    creatureTypes: [],
  },
  "Conjure Elemental": {
    profiles: [
      {
        "count": "1",
        "cr": "@item.level",
        "types": ["elemental"],
      },
    ],
    creatureTypes: ["elemental"],
  },
  "Conjure Fey": {
    profiles: [
      {
        "count": "1",
        "cr": "@item.level",
        "types": ["fey"],
      },
    ],
    creatureTypes: ["fey"],
  },
  "Conjure Minor Elementals": {
    profiles: [
      {
        "count": "1 * min(3, floor((@item.level - 2) / 2))",
        "cr": "2",
        "types": ["elemental"],
      },
      {
        "count": "2 * min(3, floor((@item.level - 2) / 2))",
        "cr": "1",
        "types": ["elemental"],
      },
      {
        "count": "4 * min(3, floor((@item.level - 2) / 2))",
        "cr": "0.5",
        "types": ["elemental"],
      },
      {
        "count": "8 * min(3, floor((@item.level - 2) / 2))",
        "cr": "0.25",
        "types": ["elemental"],
      },
    ],
    creatureTypes: [],
  },
  "Conjure Woodland Beings": {
    profiles: [
      {
        "count": "1 * min(3, floor((@item.level - 2) / 2))",
        "cr": "2",
        "types": ["fey"],
      },
      {
        "count": "2 * min(3, floor((@item.level - 2) / 2))",
        "cr": "1",
        "types": ["fey"],
      },
      {
        "count": "4 * min(3, floor((@item.level - 2) / 2))",
        "cr": "0.5",
        "types": ["fey"],
      },
      {
        "count": "8 * min(3, floor((@item.level - 2) / 2))",
        "cr": "0.25",
        "types": ["fey"],
      },
    ],
    creatureTypes: ["fey"],
  },
  "Summon Greater Demon": {
    profiles: [
      {
        "count": "1",
        "cr": "@item.level + 1",
        "types": ["fiend"],
      },
    ],
    creatureTypes: [],
  },
  "Summon Lesser Demons": {
    profiles: [
      {
        "count": "2 * min(3, floor((@item.level - 2) / 2))",
        "cr": "1",
        "types": ["fiend"],
      },
      {
        "count": "4 * min(3, floor((@item.level - 2) / 2))",
        "cr": "0.5",
        "types": ["fiend"],
      },
      {
        "count": "8 * min(3, floor((@item.level - 2) / 2))",
        "cr": "0.25",
        "types": ["fiend"],
      },
    ],
    creatureTypes: [],
  },
  "Infernal Calling": {
    profiles: [
      {
        "count": "1",
        "cr": "@item.level + 1",
        "types": ["fiend"],
      },
    ],
    creatureTypes: [],
  },
};
