import DDBEnricherData from "../../data/DDBEnricherData";
import { regionPlacer } from "../../data/RegionBuilders";

const AURA_SAVE_ID = "ddbGuardianAuraS";

/**
 * The importer-built Guardian of Faith summon. "Place Aura" puts a 10-foot emanation on the
 * guardian token and rolls nothing: the guardian appearing next to an enemy is not that enemy
 * moving within 10 feet. The region fires Guardian Aura, the save, for an enemy that moves within
 * 10 feet for the first time on a turn (2024 also when it starts its turn there). Each use spends
 * 20 of the 60-damage pool, so the guardian vanishes when the pool is exhausted (delete the region).
 */
export default class GuardianAura extends DDBEnricherData {
  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      id: AURA_SAVE_ID,
      targetType: "enemy",
      targetCount: "1",
      noTemplate: true,
      activationType: "special",
      activationCondition: this.is2014
        ? "An enemy moves to a space within 10 feet of the guardian for the first time on a turn"
        : "An enemy moves to a space within 10 feet of the guardian for the first time on a turn or starts its turn there",
      addItemConsume: true,
      itemConsumeValue: "20",
      data: {
        save: {
          ability: ["dex"],
          dc: {
            calculation: "spellcasting",
            formula: "",
          },
        },
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "20",
              type: "radiant",
            }),
          ],
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [regionPlacer("Place Aura", {
      template: { type: "radius", size: "10" },
      affects: "enemy",
      activationType: "special",
      activationCondition: "When the guardian appears",
      behaviors: [
        DDBEnricherData.BehaviorHelper.activity({
          events: this.is2014 ? ["tokenEnter"] : ["tokenEnter", "tokenTurnStart"],
          enterOn: "movement",
          excludeSelf: true,
          activityId: AURA_SAVE_ID,
        }),
      ],
    })];
  }

  override get override(): IDDBOverrideData {
    return {
      data: {
        system: {
          uses: {
            spent: 0,
            max: "60",
            recovery: [],
          },
        },
      },
    };
  }

}
