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

}
