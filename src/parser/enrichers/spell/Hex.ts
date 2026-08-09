import { DICTIONARY } from "../../../config/_module";
import { utils } from "../../../lib/_module";
import DDBEnricherData from "../data/DDBEnricherData";

export default class Hex extends DDBEnricherData {

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Mark Target",
      id: "ddbHexMarkTarget",
      data: {
        midiProperties: { chooseEffects: true },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
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

  override get effects(): IDDBEffectHint[] {
    return DICTIONARY.actor.abilities.map((ability) => {
      return {
        name: `Hexed - ${utils.capitalize(ability.long)}`,
        changes: [
          DDBEnricherData.ChangeHelper.disadvantageAbilityCheckChange(ability.value),
        ],
      };
    });
  }

  override get setMidiOnUseMacroFlag(): IDDBSetMidiOnUseMacroFlag {
    return {
      name: "hex.js",
      type: "spell",
      triggerPoints: ["postActiveEffects"],
    };
  }

  override get itemMacro(): IDDBItemMacro {
    return {
      name: "hex.js",
      type: "spell",
    };
  }

}
