import {
  baseItemEffect,
} from "./effects.js";

import DDBMacros from "./DDBMacros.js";

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

  await DDBMacros.setItemMacroFlag(document, "item", "wounding.js");
  effect.changes.push(DDBMacros.generateMacroChange({ macroType: "item", macroName: "wounding.js" }));
  document.effects.push(effect);

  return document;
}

async function lifeStealingEffect(document) {
  let effect = baseItemEffect(document, document.name);
  await DDBMacros.setItemMacroFlag(document, "item", "lifeStealing.js");
  DDBMacros.setMidiOnUseMacroFlag(document, "item", "lifeStealing.js", ["postActiveEffects"]);
  document.effects.push(effect);
  return document;
}

const RESTRICTION_MAPPINGS = [
  {
    // name: "Extra Critical",
    ddb: ["20 on the Attack Roll"],
    restriction: `@workflow.diceRoll === 20`,
  },
  {
    name: "of Life Stealing",
    ddb: ["20 on the Attack Roll, Not Construct or Undead"],
    restriction: `@workflow.diceRoll === 20 && !(["construct", "undead"].includes("@raceOrType"))`,
    effect: true,
    effectFunction: lifeStealingEffect,
  },
  {
    name: "Bloodaxe",
    ddb: ["to creatures that aren’t constructs or undead"],
    restriction: `!(["construct", "undead"].includes("@raceOrType"))`,
  },
  {
    // name: "Plants",
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
    // name: "Undead",
    ddb: [
      "Against Undead Targets",
      "Against undead targets.",
      "(Against undead)",
      "An undead creature hit by the weapon takes an extra 1d8 radiant damage."
    ],
    restriction: `["undead"].includes("@raceOrType")`,
  },
  {
    // name: "Dragon",
    ddb: ["When you hit a dragon with this weapon"],
    restriction: `["dragon"].includes("@raceOrType")`,
  },
  {
    name: "of Wounding",
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
    // name: "Giants",
    ddb: ["Against Giants"],
    restriction: `["giant"].includes("@raceOrType")`,
  },
  {
    name: "Flame Tongue",
    ddb: ["While Flaming"],
    restriction: "",
    removeOther: true,
    damageParts: [["2d6[fire]", "fire"]],
    replaceFlavor: "Extra damage only whilst flaming",
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

export async function addRestrictionFlags(document, addEffects) {

  const restrictions = foundry.utils.getProperty(document, "flags.ddbimporter.dndbeyond.restrictions");
  if (!restrictions || restrictions.length == 0) return document;
  const name = document.flags.ddbimporter?.originalName ?? document.name;

  const nameMatch = RESTRICTION_MAPPINGS.find((r) => {
    return r.name && name.toLowerCase()[0].includes(r.name.toLowerCase());
  });
  const restriction = nameMatch
    ? nameMatch
    : RESTRICTION_MAPPINGS.find((r) => {
      return r.ddb.map((m) => m.toLowerCase())[0].includes(restrictions[0].toLowerCase());
    });

  if (restriction) {
    if (restriction.removeOther) {
      foundry.utils.setProperty(document, "system.formula", "");
    }
    if (restriction.replaceFlavor) {
      foundry.utils.setProperty(document, "system.chatFlavor", restriction.replaceFlavor);
    }
    if (restriction.damageParts) {
      document.system.damage.parts.push(...restriction.damageParts);
    }

    if (!game.modules.get("midi-qol")?.active || !addEffects) return document;

    let restrictionText = restriction.restriction;

    if (document.system.attunement > 0 && !["", "false"].includes(restriction.restriction)) {
      restrictionText += ` && @item.attunement !== 1`;
    }
    // foundry.utils.setProperty(document, "system.activation.condition", restrictionText);
    foundry.utils.setProperty(document, "flags.midi-qol.effectCondition", restrictionText);

    if (restriction.effectRestrictionActivation) {
      foundry.utils.setProperty(document, "flags.midi-qol.effectActivation", true);
    }

    if (restriction.effect) {
      document = await restriction.effectFunction(document);
    }
  }

  // effects needed for:
  // mace of disruption
  // oathbow
  // sharpness - needs light effect
  // sunswords
  // "Javelin of Lightning"
  // dwarven thrower
  // axe of dwarfish lords

  return document;
}
