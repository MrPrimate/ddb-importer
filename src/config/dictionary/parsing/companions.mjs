
const COMPANION_SPELLS_2014 = [
  "Summon Aberration",
  "Summon Beast",
  "Summon Celestial",
  "Summon Construct",
  "Summon Elemental",
  "Summon Fey",
  "Summon Fiend",
  "Summon Shadowspawn",
  "Summon Undead",
  "Summon Draconic Spirit",
  // "Spirit of Death",
];

const MULTI_COMPANIONS_2014 = {
  "Aberrant Spirit": ["Slaad", "Beholderkin", "Star Spawn"],
  "Bestial Spirit": ["Air", "Land", "Water"],
  "Celestial Spirit": ["Avenger", "Defender"],
  "Construct Spirit": ["Clay", "Metal", "Stone"],
  "Elemental Spirit": ["Air", "Earth", "Fire", "Water"],
  "Fey Spirit": ["Fuming", "Mirthful", "Tricksy"],
  "Fiendish Spirit": ["Demon", "Devil", "Yugoloth"],
  "Shadow Spirit": ["Fury", "Despair", "Fear"],
  "Undead Spirit": ["Ghostly", "Putrid", "Skeletal"],
  "Drake Companion": ["Acid", "Cold", "Fire", "Lightning", "Poison"],
  "Draconic Spirit": ["Chromatic", "Gem", "Metallic"],
  // "Primal Companion": ["Beast of the Land", "Beast of the Sea", "Beast of the Sky"],
};

const COMPANION_SPELLS_2024 = [
  "Summon Aberration",
  "Summon Beast",
  "Summon Celestial",
  "Summon Construct",
  "Summon Elemental",
  "Summon Fey",
  "Summon Fiend",
  "Summon Shadowspawn",
  "Summon Undead",
  "Summon Draconic Spirit",
  // "Spirit of Death",
  "Animate Objects",
  "Giant Insect",
  "Find Steed",
  "Summon Dragon",
  "Homunculus Servant",
  "Summon Plant",
  "Summon Sea Spirit",
];

const MULTI_COMPANIONS_2024 = {
  "Aberrant Spirit": ["Slaad", "Beholderkin", "Mind Flayer"],
  "Bestial Spirit": ["Air", "Land", "Water"],
  "Celestial Spirit": ["Avenger", "Defender"],
  "Construct Spirit": ["Clay", "Metal", "Stone"],
  "Elemental Spirit": ["Air", "Earth", "Fire", "Water"],
  "Fey Spirit": ["Fuming", "Mirthful", "Tricksy"],
  "Fiendish Spirit": ["Demon", "Devil", "Yugoloth"],
  "Undead Spirit": ["Ghostly", "Putrid", "Skeletal"],
  "Primal Companion": ["Beast of the Land", "Beast of the Sea", "Beast of the Sky"],
  "Animated Object": ["Tiny", "Small", "Medium", "Large", "Huge"],
  "Giant Insect": ["Centipede", "Spider", "Wasp"],
  "Otherworldly Steed": ["Celestial", "Fey", "Fiend"],
  "Plant Spirit": ["Blooming", "Oaken", "Thorny"],
  "Sea Serpent Spirit": ["Enormous Mouth", "Glowing Lantern", "Scaled Wings"],
};

const COMPANION_FEATURES = [
  "Steel Defender",
  "Artificer Infusions",
  "Summon Wildfire Spirit",
  // "Primal Companion",
  "Drake Companion",
  // "Drake Companion: Summon",
  // parsed as separate choice features
  "Beast of the Land",
  "Beast of the Sea",
  "Beast of the Sky",
  "Call of the Shadowseeds",
  "Brawler's Best Friend",
];

const COMPANION_OPTIONS = {
  "Primal Companion": [
    "Beast of the Land",
    "Beast of the Sea",
    "Beast of the Sky",
  ],
  "Drake Companion": [
    "Summon",
  ],
};

const CR_SUMMONING_SPELLS_2014 = [
  "Conjure Animals",
  "Conjure Celestial",
  "Conjure Elemental",
  "Conjure Fey",
  "Conjure Minor Elementals",
  "Conjure Woodland Beings",
  "Summon Greater Demon",
  "Infernal Calling",
  "Summon Lesser Demons",
  "Find Familiar",
  "Flock of Familiars",
];

const CR_SUMMONING_SPELLS_2024 = [
  "Summon Greater Demon",
  "Infernal Calling",
  "Summon Lesser Demons",
  "Find Familiar",
];

const CR_SUMMONING_FEATURES_2014 = [
  "Wild Companion",
  "Pact Boon: Pact of the Chain",
  "Pact of the Chain",
];

const CR_SUMMONING_FEATURES_2024 = [
  "Wild Companion",
  "Eldritch Invocations: Pact of the Chain",
  "Pact of the Chain",
];

const FIND_FAMILIAR_MATCHES = [
  "Find Familiar",
  "Flock of Familiars",
  "Pact of the Chain",
  "Pact Boon: Pact of the Chain",
  "Invocation: Pact of the Chain",
  "Eldritch Invocations: Pact of the Chain",
];

const FAMILIAR_COUNTS = {
  "Flock of Familiars": "3",
};


export const COMPANIONS = {
  COMPANION_FEATURES,
  COMPANION_SPELLS_2014,
  COMPANION_SPELLS_2024,
  COMPANION_OPTIONS,
  CR_SUMMONING_SPELLS_2014,
  CR_SUMMONING_SPELLS_2024,
  CR_SUMMONING_FEATURES_2014,
  CR_SUMMONING_FEATURES_2024,
  MULTI_COMPANIONS_2014,
  MULTI_COMPANIONS_2024,
  FIND_FAMILIAR_MATCHES,
  FAMILIAR_COUNTS,
};
