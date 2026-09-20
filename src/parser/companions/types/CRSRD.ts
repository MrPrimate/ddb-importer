/**
 * Challenge-rating summons. `match` is merged onto the activity: the Conjure spells call friendly
 * creatures, so they take the caster's token disposition as the dnd5e SRD pack has it, while the
 * demon and devil callings are left neutral because the summoned fiend is not the caster's ally.
 */
export const CR_DATA = {
  "Conjure Animals": {
    match: { disposition: true },
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
    // "Each beast is also considered fey": the summoned beast's type changes, it is not a filter
    creatureTypes: ["fey"],
  },
  "Conjure Celestial": {
    match: { disposition: true },
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
    match: { disposition: true },
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
    match: { disposition: true },
    profiles: [
      {
        "count": "1",
        "cr": "@item.level",
        // a fey creature, or a fey spirit that takes the form of a beast
        "types": ["beast", "fey"],
      },
    ],
    creatureTypes: ["fey"],
  },
  "Conjure Minor Elementals": {
    match: { disposition: true },
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
    match: { disposition: true },
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
