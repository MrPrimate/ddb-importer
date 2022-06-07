import {
  baseItemEffect,
} from "./effects.js";

import { loadMacroFile, generateMacroChange, generateItemMacroFlag } from "./macros.js";

async function woundingWeaponEffect(document) {
  let effect = baseItemEffect(document, document.name);

  effect.transfer = false;
  effect.flags.dae.macroRepeat = "startEveryTurn";
  effect.flags.dae.stackable = "count";
  effect.flags.dae.transfer = false;
  effect.duration = {
    startTime: null,
    seconds: null,
    rounds: 400,
    turns: null,
    startRound: null,
    startTurn: null,
  };

  const itemMacroText = await loadMacroFile("item", "wounding.js");
  document.flags["itemacro"] = generateItemMacroFlag(document, itemMacroText);
  effect.changes.push(generateMacroChange());
  document.effects.push(effect);

  return document;
}

const RESTRICTION_MAPPINGS = [
  {
    name: "Extra Critical",
    ddb: ["20 on the Attack Roll"],
    restriction: `@workflow.diceRoll === 20`,
  },
  {
    name: "Life-Stealing",
    ddb: ["20 on the Attack Roll, Not Construct or Undead"],
    restriction: `@workflow.diceRoll === 20 && !(["construct", "undead"].includes("@raceOrType"))`,
  },
  {
    name: "Bloodaxe",
    ddb: ["to creatures that aren’t constructs or undead"],
    restriction: `!(["construct", "undead"].includes("@raceOrType"))`,
  },
  {
    name: "Plants",
    ddb: ["against a plant (an ordinary plant or a creature with the Plant type) or a wooden object that isn’t being worn or carried"],
    restriction: `["plant"].includes("@raceOrType")`
  },
  //  "Javelin of Lightning"
  {
    name: "Javelin of Lightning",
    ddb: ["On Hit or DC 13 Dexterity Save for Half Damage"],
    restriction: ``,
    save: true,
    macro: true,
  },
  {
    name: "Zariel",
    ddb: ["3d10 radiant if you’re wielding the weapon with two hands"],
    restriction: ``,
  },
  {
    name: "Undead",
    ddb: [
      "Against Undead Targets",
      "Against undead targets.",
      "(Against undead)",
      "An undead creature hit by the weapon takes an extra 1d8 radiant damage."
    ],
    restriction: `["undead"].includes("@raceOrType")`,
  },
  {
    name: "Dragon",
    ddb: ["When you hit a dragon with this weapon"],
    restriction: `["dragon"].includes("@raceOrType")`,
  },
  {
    name: "Wounding",
    ddb: ["Per Wound, DC 15 Constitution Save Ends Effect"],
    restriction: "",
    effect: true,
    effectFunction: woundingWeaponEffect,
  },
  {
    name: "Markovia",
    ddb: ["Against Fiends or Undead", "Against a fiend or an undead"],
    restriction: `["fiend", "undead"].includes("@raceOrType")`,
  },
  {
    name: "Riteknife",
    ddb: ["For each soul imprisoned in the dagger"],
    restriction: `false`,
  },
  {
    name: "Oathbow",
    ddb: ["Against Sworn Enemy"],
    restriction: `false`,
  },
  {
    name: "Matalotok",
    ddb: ["30-foot-radius sphere"],
    restriction: `false`,
  },
  {
    name: "Mastix",
    ddb: ["regain hit points equal to half the amount of necrotic damage dealt"],
    restriction: "",
    macro: true,
  },
  {
    name: "Mace of Disruption",
    ddb: ["Special"],
    nameMatch: "Mace of Disruption",
    restriction: `["fiend", "undead"].includes("@raceOrType")`,
  },
  {
    name: "Gurt",
    ddb: ["plus an extra 2d12 slashing damage if the target is human"],
    restriction: `["human"].includes("@raceOrType")`,
  },
  {
    name: "Grovelthrash",
    ddb: ["If you do, you take 1d6 psychic damage"],
    restriction: `false`,
  },
  {
    name: "Giants",
    ddb: ["Against Giants"],
    restriction: `["giant"].includes("@raceOrType")`,
  },
  {
    name: "Flame Tongue",
    ddb: ["While Flaming"],
    restriction: "",
  },
  {
    name: "Dwarven Thrower",
    ddb: ["On hit with a ranged attack against Giants", "When Thrown (+2d8 against Giants)"],
    restriction: `["giant"].includes("@raceOrType")`,
  },
  {
    name: "Dragon's Wrath",
    ddb: [
      "On a hit, the weapon deals an extra damage of the type dealt by the dragon’s breath weapon. (Wakened)",
      "On a hit, the weapon deals an extra damage of the type dealt by the dragon’s breath weapon. (Stirring)",
      "On a hit, the weapon deals an extra damage of the type dealt by the dragon’s breath weapon. (Ascendant)",

    ],
    restriction: ``,
  },
  {
    name: "Dagger of Venom",
    ddb: ["DC 15 Constitution Save Negates"],
    restriction: `false`,
  },
  {
    name: "Yagas Pestle",
    ddb: ["Per Charge (Max 3)"],
    restriction: `false`,
  },
];

export async function addRestrictionFlags(document) {

  if (!game.modules.get("midi-qol")?.active) return document;
  const restrictions = getProperty(document, "flags.ddbimporter.dndbeyond.restrictions");
  if (!restrictions || restrictions.length == 0) return document;

  const restriction = RESTRICTION_MAPPINGS.find((r) => {
    return r.ddb.map((m) => m.toLowerCase())[0].includes(restrictions[0].toLowerCase());
  });

  if (restriction) {
    let restrictionText = restriction.restriction;

    if (document.data.attunement > 0 && !["", "false"].includes(restriction.restriction)) {
      restrictionText += ` && @item.attunement !== 1`;
    }
    setProperty(document, "data.activation.condition", restrictionText);

    if (restriction.effect) {
      document = await restriction.effectFunction(document);
    }
  }

  // effects needed for:
  // mace of disruption
  // oathbow
  // sharpness
  // devils glaive
  // sunswords
  // "Javelin of Lightning"
  // dwarven thrower
  // axe of dwarfish lords

  return document;
}
