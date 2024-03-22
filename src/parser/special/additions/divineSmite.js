// import DICTIONARY from '../dictionary.js';
import utils from "../../../lib/utils.js";
import DDBHelper from "../../../lib/DDBHelper.js";

export function getDivineSmiteSpell(feature) {
  const restriction = "Against undead or fiends";

  const damageTagInfo = DDBHelper.getDamageTag({ subType: "radiant", restriction: "" });
  const regularDamage = utils.parseDiceString("2d8", "", damageTagInfo.damageTag).diceString;
  const extraDamageTagInfo = DDBHelper.getDamageTag({ subType: "radiant", restriction });
  const extraDamage = utils.parseDiceString("1d8", "", extraDamageTagInfo.damageTag).diceString;

  let result = {
    flags: {
      ddbimporter: {
        ignoreItemUpdate: true,
      },
    },
    name: "Divine Smite",
    type: "spell",
    img: "icons/skills/melee/weapons-crossed-swords-yellow-teal.webp",
    system: {
      description: {
        value: feature.system.description.value,
        chat: "",
      },
      source: "PHB PG. 85",
      activation: {
        type: "special",
        cost: null,
        condition: "",
      },
      duration: {
        value: null,
        units: "",
      },
      target: {
        value: 1,
        units: "",
        type: "enemy",
      },
      range: {
        value: null,
        long: null,
        units: "",
      },
      uses: {
        value: 0,
        max: 0,
        per: "",
      },
      consume: {
        type: "",
        target: "",
        amount: null,
      },
      ability: "",
      actionType: "other",
      attack: {
        bonus: 0,
      },
      chatFlavor: "",
      critical: null,
      damage: {
        parts: [
          [`${regularDamage}`, "radiant"],
        ],
        versatile: "",
      },
      formula: "",
      save: {
        ability: "",
        dc: null,
        scaling: "spell",
      },
      level: 1,
      school: "",
      properties: ["mgc"],
      materials: {
        value: "",
        consumed: false,
        cost: 0,
        supply: 0,
      },
      preparation: {
        mode: "always",
        prepared: true,
      },
      scaling: {
        mode: "level",
        formula: "1d8",
      },
    },
  };

  result.system.formula = `${regularDamage} + ${extraDamage}`;
  result.system.chatFlavor = `Use Other damage ${restriction.toLowerCase()}`;
  if (game.modules.get("midi-qol")?.active) {
    // result.system.activation.condition = `["undead", "fiend"].includes("@raceOrType")`;
    foundry.utils.setProperty(document, "flags.midi-qol.effectCondition", `["undead", "fiend"].includes("@raceOrType")`);
  }

  return result;
}

