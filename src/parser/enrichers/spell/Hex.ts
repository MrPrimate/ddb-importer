import { DICTIONARY } from "../../../config/_module";
import { utils } from "../../../lib/_module";
import DDBEnricherData from "../data/DDBEnricherData";

export default class Hex extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      name: "Mark Target",
      id: "ddbHexMarkTarget",
      data: {
        midiProperties: { chooseEffects: true },
      },
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Hex Damage",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
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
          activationOverride: { type: "special", condition: "When you hit creature with attack" },
        },
      },
      {
        init: {
          name: "Move Hex",
          type: DDBEnricherData.ACTIVITY_TYPES.FORWARD,
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

  get effects(): IDDBEffectHint[] {
    return DICTIONARY.actor.abilities.map((ability) => {
      return {
        name: `Hexed - ${utils.capitalize(ability.long)}`,
        changes: [
          DDBEnricherData.ChangeHelper.addChange(`${CONFIG.Dice.D20Roll.ADV_MODE.DISADVANTAGE}`, 20, `system.abilities.${ability.value}.check.roll.mode`),
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
