import DDBEnricherData from "../../data/DDBEnricherData";
import type DDBClassFeatureEnricher from "../../DDBClassFeatureEnricher";

export default class SuperiorDefense extends DDBEnricherData<DDBClassFeatureEnricher> {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Superior Defense",
      activationType: "special",
      activationCondition: "At the start of your turn",
      targetType: "self",
      addItemConsume: true,
      itemConsumeTargetName: this.ddbEnricher.isParentClass2014 ? "Ki" : "Monk's Focus",
      itemConsumeValue: 3,
      data: {
        duration: {
          value: "1",
          units: "minute",
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Superior Defense",
        options: {
          durationSeconds: 60,
          description: "Resistance to all damage except Force. Ends early if you have the Incapacitated condition.",
        },
        changes: DDBEnricherData.allDamageTypes(["force"]).map((element) =>
          DDBEnricherData.ChangeHelper.damageResistanceChange(element),
        ),
      },
    ];
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

}
