import DDBEnricherData from "../../data/DDBEnricherData";
import type DDBClassFeatureEnricher from "../../DDBClassFeatureEnricher";

export default class CrushingGuilt extends DDBEnricherData<DDBClassFeatureEnricher> {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  get activity(): IDDBActivityData {
    return {
      activationType: "special",
      targetType: "creature",
      addItemConsume: true,
      itemConsumeValue: "3",
      itemConsumeTargetName: this.ddbEnricher.isParentClass2014 ? "Ki" : "Monk's Focus",
      data: {
        target: {
          affects: {
            type: "creature",
            choice: true,
          },
          template: {
            contiguous: false,
            type: "radius",
            size: "20",
            units: "ft",
          },
        },
        save: {
          ability: ["wis"],
          dc: {
            calculation: "wis",
            formula: "",
          },
        },
        damage: {
          onSave: "half",
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "3@scale.monk.die.die",
              type: "psychic",
            }),
          ],
        },
      },
    };
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Prone",
        statuses: ["Prone"],
      },
    ];
  }

  get override(): IDDBOverrideData {
    return {
      data: {
        flags: {
          ddbimporter: {
            skipScale: true,
          },
        },
      },
    };
  }

}
