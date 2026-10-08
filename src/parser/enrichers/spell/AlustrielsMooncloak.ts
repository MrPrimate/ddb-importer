import DDBEnricherData from "../data/DDBEnricherData";
import { endSpellChanges, riders, selfEnchantCast } from "./_SelfEnchantSpell";

/**
 * Cast is a self-enchantment that still places the moonlight area (see _SelfEnchantSpell), whose
 * region applies Within Moonlight. Liberation and Respite are activity riders, so they only appear
 * while the spell lasts.
 */
export default class AlustrielsMooncloak extends DDBEnricherData {

  static CAST_ID = "ddbMooncloakCast";

  static LIBERATION_ID = "ddbMooncloakLibr";

  static RESPITE_ID = "ddbMooncloakResp";

  static PROFILE_ID = "ddbMooncloakEnch";

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.ENCHANT;
  }

  override get activity(): IDDBActivityData {
    return selfEnchantCast({
      id: AlustrielsMooncloak.CAST_ID,
      keepTemplate: true,
      data: {
        behaviors: [
          DDBEnricherData.BehaviorHelper.applyEffect({ effects: "Within Moonlight" }),
        ],
      },
    });
  }

  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Liberation",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateDuration: true,
          durationOverride: { units: "inst", concentration: false },
          generateConsumption: false,
          noSpellslot: true,
          generateAttack: false,
          onsave: false,
          noeffect: true,
        },
        overrides: {
          id: AlustrielsMooncloak.LIBERATION_ID,
          // not the spell's moonlight area: one creature in it
          noTemplate: true,
          targetType: "creature",
          activationType: "reaction",
          overrideActivation: true,
        },
      },
      {
        init: {
          name: "Respite",
          type: DDBEnricherData.ACTIVITY_TYPES.HEAL,
        },
        build: {
          generateDuration: true,
          durationOverride: { units: "inst", concentration: false },
          generateDamage: false,
          generateHealing: true,
          generateRange: true,
          noSpellslot: true,
          generateConsumption: true,
          healingPart: DDBEnricherData.basicDamagePart({
            number: 4,
            denomination: 10,
            bonus: "@mod",
            type: "healing",
          }),
        },
        overrides: {
          id: AlustrielsMooncloak.RESPITE_ID,
          // not the spell's moonlight area: one creature in it
          noTemplate: true,
          targetType: "creature",
          activationType: "action",
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Within Moonlight",
        standalone: true,
        options: {
          durationSeconds: 60,
        },
        changes: [
          DDBEnricherData.ChangeHelper.damageResistanceChange("cold"),
          DDBEnricherData.ChangeHelper.damageResistanceChange("lightning"),
          DDBEnricherData.ChangeHelper.damageResistanceChange("radiant"),
        ],
        statuses: ["coverHalf"],
      },
      {
        name: "Alustriel's Mooncloak",
        type: "enchant",
        activityMatch: "Cast",
        options: {
          durationSeconds: 60,
        },
        changes: endSpellChanges(AlustrielsMooncloak.CAST_ID, "End Mooncloak", { clearTemplate: true }),
        data: {
          _id: AlustrielsMooncloak.PROFILE_ID,
          flags: {
            ddbimporter: riders({ activities: [AlustrielsMooncloak.LIBERATION_ID, AlustrielsMooncloak.RESPITE_ID] }),
          },
        },
      },
    ];
  }


  override get override(): IDDBOverrideData {
    return {
      data: {
        system: {
          target: {
            affects: {
              type: "ally",
            },
          },
        },
      },
    };
  }

}
