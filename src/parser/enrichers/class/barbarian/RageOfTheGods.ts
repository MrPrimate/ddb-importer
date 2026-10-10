import DDBEnricherData from "../../data/DDBEnricherData";
import { riders, toggleOffChanges } from "../../data/SelfEnchant";

/**
 * Taking the divine form is a self-enchantment whose riders are the form's effect and Resurrect,
 * so the reaction only appears while the form lasts.
 */
export default class RageOfTheGods extends DDBEnricherData {

  static RESURRECT_ID = "ddbRageOfGodsRes";

  static EFFECT_ID = "ddbRageOfGodsEff";

  // the Divine Warrior Form option is this feature's own activity; a class munch would otherwise
  // add it as a choice of one
  override get noChoiceBuild(): boolean {
    return true;
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.ENCHANT;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Rage of the Gods",
      targetType: "self",
      noTemplate: true,
      activationType: "special",
      activationCondition: "When you activate rage",
      data: {
        duration: { value: "1", units: "minute" },
        enchant: {
          self: true,
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Rage of the Gods",
        options: {
          transfer: true,
          durationSeconds: 60,
        },
        data: {
          _id: RageOfTheGods.EFFECT_ID,
        },
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("@attributes.movement.walk", 20, "system.attributes.movement.fly"),
          DDBEnricherData.ChangeHelper.damageResistanceChange("necrotic"),
          DDBEnricherData.ChangeHelper.damageResistanceChange("psychic"),
          DDBEnricherData.ChangeHelper.damageResistanceChange("radiant"),
        ],
      },
      {
        name: "Rage of the Gods",
        type: "enchant",
        activityMatch: "Rage of the Gods",
        changes: toggleOffChanges("End Rage of the Gods"),
        data: {
          flags: {
            ddbimporter: riders({ activities: [RageOfTheGods.RESURRECT_ID], effects: [RageOfTheGods.EFFECT_ID] }),
          },
        },
      },
    ];
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Resurrect",
          type: DDBEnricherData.ACTIVITY_TYPES.HEAL,
        },
        build: {
          generateConsumption: false,
          generateTarget: true,
          generateRange: false,
          generateActivation: true,
          generateDamage: false,
          generateHealing: true,
          activationOverride: {
            type: "reaction",
            value: 1,
            condition: "",
          },
          healingPart: DDBEnricherData.basicDamagePart({
            customFormula: "@classes.barbarian.levels",
            type: "healing",
          }),
          rangeOverride: {
            units: "ft",
            value: "30",
          },
        },
        overrides: {
          id: RageOfTheGods.RESURRECT_ID,
        },
      },
    ];
  }

}
