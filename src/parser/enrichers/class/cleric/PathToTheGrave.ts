import { DICTIONARY } from "../../../../config/_module";
import DDBEnricherData from "../../data/DDBEnricherData";

// 2024 version
export default class PathToTheGrave extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Activate Path to the Grave",
      addItemConsume: true,
      itemConsumeTargetName: "Channel Divinity",
      activationType: "bonus",
      data: {
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        activityMatch: "Activate Path to the Grave",
        name: "Cursed",
        options: {
          durationSeconds: 6,
          expiry: "turnStart",
        },
        daeSpecialDurations: ["turnStartSource"],
        changes: DICTIONARY.actor.abilities.map((ability) => DDBEnricherData.ChangeHelper.disadvantageAbilitySaveChange(ability.value)),
      },
    ];
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "End Curse",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        overrides: {
          activationType: "special",
          data: {
            range: {
              value: 30,
              units: "ft",
            },
            damage: {
              parts: [
                DDBEnricherData.basicDamagePart({
                  customFormula: "@classes.cleric.levels",
                  types: ["necrotic", "radiant"],
                }),
              ],
            },
          },
        },
      },
    ];
  }

}
