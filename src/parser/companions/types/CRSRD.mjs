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
