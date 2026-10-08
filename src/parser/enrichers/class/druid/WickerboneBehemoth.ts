import DDBEnricherData from "../../data/DDBEnricherData";
import { riders, toggleOffChanges } from "../../data/SelfEnchant";

/**
 * Wickerbone Behemoth: a bonus action and a Wild Shape use turn you into a behemoth for 10 minutes
 * (Shillelagh arms, Barkskin without Concentration). Attackers take 1d4 piercing splinters (2d4 from
 * druid level 10), and you regenerate half the damage taken each turn up to 5 x proficiency bonus.
 * Becoming it is a self-enchantment whose riders are the form's effect and Splinter, so the
 * splinters only appear while the form lasts.
 */
export default class WickerboneBehemoth extends DDBEnricherData {

  static SPLINTER_ID = "ddbWickerboneSpl";

  static EFFECT_ID = "ddbWickerboneEff";

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.ENCHANT;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Become Behemoth",
      targetType: "self",
      noTemplate: true,
      activationType: "bonus",
      activationCondition: "Not wearing armor or holding a Shield",
      addItemConsume: true,
      itemConsumeTargetName: "wild-shape",
      data: {
        duration: { value: "10", units: "minute" },
        enchant: {
          self: true,
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: { name: "Splinter", type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE },
        build: {
          generateConsumption: false,
          generateTarget: true,
          generateActivation: true,
          generateDamage: true,
          activationOverride: { type: "special", value: 1, condition: "A creature damages you with an attack (each creature of your choice within 5 feet)" },
          damageParts: [DDBEnricherData.basicDamagePart({ customFormula: "(1 + min(1, floor(@classes.druid.levels / 10)))d4", types: ["piercing"] })],
        },
        overrides: { id: WickerboneBehemoth.SPLINTER_ID, targetType: "creature", noConsumeTargets: true, noTemplate: true },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Wickerbone Behemoth",
        options: {
          transfer: true,
          durationSeconds: 600,
          description: "Each arm is a Shillelagh club (with its mastery); Disadvantage on Sleight of Hand with them. Barkskin without Concentration. At the start of each turn regain half the damage taken since your last turn, up to five times your proficiency bonus (not while Unconscious).",
        },
        data: {
          _id: WickerboneBehemoth.EFFECT_ID,
        },
      },
      {
        name: "Wickerbone Behemoth",
        type: "enchant",
        activityMatch: "Become Behemoth",
        changes: toggleOffChanges("Leave Behemoth Form"),
        data: {
          flags: {
            ddbimporter: riders({ activities: [WickerboneBehemoth.SPLINTER_ID], effects: [WickerboneBehemoth.EFFECT_ID] }),
          },
        },
      },
    ];
  }

}
