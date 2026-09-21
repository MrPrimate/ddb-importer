import DDBEnricherData from "../../data/DDBEnricherData";
import { linkMonsterSummons, monsterSummon } from "../_MonsterSummons";

const EARTH_REINFORCEMENTS = [{ name: "Earth Spark", count: "5", ddbId: 4485830 }];

/**
 * DDB sets the two effects this feature grants as bold-only paragraphs under it, so they are
 * options of one feature, and the parser leaves a bare utility that spends the daily use. That
 * activity becomes Iron Skin, which has an effect to hand to the chosen Elemental; Earth
 * Reinforcements summons five earth sparks out of the monster compendium. Either option is the
 * one daily use.
 */
export default class ConvocationOfIron extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      name: "Iron Skin",
      targetType: "ally",
      activationCondition: "The force of iron or another Elemental within 30 feet; ends if concentration is broken",
      data: {
        range: { override: true, value: "30", units: "ft" },
        duration: { override: true, value: "1", units: "minute" },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      monsterSummon("Earth Reinforcements", {
        creatures: EARTH_REINFORCEMENTS,
        activationType: "bonus",
        activationCondition: "Appear within 20 feet of the chosen Elemental",
        range: "20",
        consume: true,
      }),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Iron Skin",
        activityMatch: "Iron Skin",
        options: { durationSeconds: 60 },
        changes: ["bludgeoning", "piercing", "slashing"]
          .map((type) => DDBEnricherData.ChangeHelper.addChange(type, 20, "system.traits.dr.value")),
      },
    ];
  }

  override get keepParsedActivities(): boolean {
    return true;
  }

  override async cleanup(): Promise<void> {
    await linkMonsterSummons(this.data, EARTH_REINFORCEMENTS, this.is2024);
  }

}
