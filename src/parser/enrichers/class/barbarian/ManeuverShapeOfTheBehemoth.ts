import DDBEnricherData from "../../data/DDBEnricherData";
import { riders, toggleOffChanges } from "../../data/SelfEnchant";

/**
 * Embodying the behemoth is a self-enchantment whose riders are the form's effect and its
 * Temporary Hit Points, so those only appear while it lasts.
 */
export default class ManeuverShapeOfTheBehemoth extends DDBEnricherData {

  static TEMP_HP_ID = "ddbShapeBehemoTH";

  static EFFECT_ID = "ddbShapeBehemoEf";


  override get builtFeaturesFromActionFilters(): string[] {
    return ["Embody Behemoth", "Embody Behemoth: Bonus Weapon Damage", "Embody Behemoth: Temporary HP"];
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.ENCHANT;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Embody Behemoth",
      activationType: "action",
      targetType: "self",
      noTemplate: true,
      data: {
        duration: {
          units: "minute",
          value: "1",
          concentration: true,
        },
        enchant: {
          self: true,
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Shape of the Behemoth",
        options: {
          transfer: true,
          durationSeconds: 60,
        },
        data: {
          _id: ManeuverShapeOfTheBehemoth.EFFECT_ID,
        },
        changes: [
          DDBEnricherData.ChangeHelper.overrideChange("lg", 20, "system.traits.size"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("1d6", 20, "system.bonuses.mwak.damage"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("1d6", 20, "system.bonuses.rwak.damage"),
        ],
        // dnd5e has no actor level reach attribute, so the +5 ft is AC5e's range surface
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange(
            "reach=+5",
            20,
            "flags.automated-conditions-5e.range",
          ),
        ],
      },
      {
        name: "Shape of the Behemoth",
        type: "enchant",
        activityMatch: "Embody Behemoth",
        changes: toggleOffChanges("End Behemoth Shape", { concentration: true }),
        data: {
          flags: {
            ddbimporter: riders({ activities: [ManeuverShapeOfTheBehemoth.TEMP_HP_ID], effects: [ManeuverShapeOfTheBehemoth.EFFECT_ID] }),
          },
        },
      },
    ];
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Temporary Hit Points",
          type: "heal",
        },
        build: {
          generateHealing: true,
          generateTarget: true,
          generateActivation: true,
          generateConsumption: true,
          healingPart: DDBEnricherData.basicDamagePart({ number: 1, denomination: 6, type: "temphp" }),
        },
        overrides: {
          id: ManeuverShapeOfTheBehemoth.TEMP_HP_ID,
          targetType: "self",
          activationType: "turnStart",
          activationCondition: "Start of your turn",
          noConsumeTargets: true,
        },
      },
    ];
  }

}
