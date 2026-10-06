import DDBEnricherData from "../../data/DDBEnricherData";
import type DDBClassFeatureEnricher from "../../DDBClassFeatureEnricher";
import { travelersTrickDie } from "./_TravelersTricks";

export default class BoxingLessons extends DDBEnricherData<DDBClassFeatureEnricher> {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.ATTACK;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      activationType: "special",
      activationCondition: "You take the Attack action; make two Unarmed Strikes",
      addItemConsume: true,
      itemConsumeTargetName: "Bardic Inspiration",
      data: {
        attack: {
          ability: "dex",
          type: {
            value: "melee",
            classification: "unarmed",
          },
        },
        range: {
          value: 5,
          units: "ft",
        },
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: `${travelersTrickDie(this.ddbEnricher.isClass2014("Bard"))} + @mod`,
              types: ["bludgeoning"],
            }),
          ],
        },
      },
    };
  }

  // 14th level: a hit can attempt a stunning strike (Constitution save, the bard's save DC)
  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Stunning Strike",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateConsumption: false,
          generateTarget: true,
          generateActivation: true,
          generateSave: true,
          saveOverride: { ability: ["con"], dc: { calculation: "spellcasting", formula: "" } },
          activationOverride: { type: "special", value: 1, condition: "You hit with a Boxing Lessons strike" },
        },
        overrides: {
          targetType: "creature",
          targetCount: 1,
          noTemplate: true,
          data: { visibility: { identifier: "bard", level: { min: 14, max: null } } },
        },
      },
    ];
  }

}
