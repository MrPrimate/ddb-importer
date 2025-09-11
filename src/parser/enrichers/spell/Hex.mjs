/* eslint-disable class-methods-use-this */
import { DICTIONARY } from "../../../config/_module.mjs";
import { utils } from "../../../lib/_module.mjs";
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class Hex extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      name: "Mark Target",
      id: "ddbHexMarkTarget",
      data: {
        midiProperties: { chooseEffects: true },
      },
    };
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Hex Damage",
          type: "damage",
        },
        build: {
          allowCritical: true,
          generateDamage: true,
          generateConsumption: false,
          noSpellslot: true,
          generateAttack: false,
          onsave: false,
          damageParts: [DDBEnricherData.basicDamagePart({ number: 1, denomination: 6, type: "necrotic" })],
          noeffect: true,
          activationOverride: { type: "", condition: "When you hit creature with attack" },
        },
      },
      {
        constructor: {
          name: "Move Hex",
          type: "forward",
        },
        build: {
        },
        overrides: {
          noConsumeTargets: true,
          activationType: "bonus",
          data: {
            activity: {
              id: "ddbHexMarkTarget",
            },
          },
        },
      },
    ];
  }

  get effects() {
    return DICTIONARY.actor.abilities.map((ability) => {
      return {
        name: `Hexed - ${utils.capitalize(ability.long)}`,
        changes: [
          DDBEnricherData.ChangeHelper.addChange(`${CONFIG.Dice.D20Roll.ADV_MODE.DISADVANTAGE}`, 20, `system.abilities.${ability.value}.check.roll`),
        ],
      };
    });
  }

  get setMidiOnUseMacroFlag() {
    return {
      name: "hex.js",
      type: "spell",
      triggerPoints: ["postActiveEffects"],
    };
  }

  get itemMacro() {
    return {
      name: "hex.js",
      type: "spell",
    };
  }

}
