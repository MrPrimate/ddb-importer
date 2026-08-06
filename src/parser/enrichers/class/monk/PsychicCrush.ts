import DDBEnricherData from "../../data/DDBEnricherData";
import type DDBClassFeatureEnricher from "../../DDBClassFeatureEnricher";

export default class PsychicCrush extends DDBEnricherData<DDBClassFeatureEnricher> {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  get activity(): IDDBActivityData {
    return {
      activationType: "bonus",
      targetType: "creature",
      addItemConsume: true,
      itemConsumeTargetName: this.ddbEnricher.isParentClass2014 ? "Ki" : "Monk's Focus",
      data: {
        save: {
          ability: ["str"],
          dc: {
            calculation: "wis",
            formula: "",
          },
        },
        damage: {
          onSave: "half",
          parts: [
            DDBEnricherData.basicDamagePart({
              number: 1,
              denomination: 8,
              type: "force",
            }),
          ],
        },
      },
    };
  }

  get override(): IDDBOverrideData {
    return {
      descriptionSuffix: "<p><em>The creature takes 1d8 Force damage per Pressure Point it has; adjust the damage roll to match.</em></p>",
    };
  }

}
