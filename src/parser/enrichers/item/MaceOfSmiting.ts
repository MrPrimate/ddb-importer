import DDBEnricherData from "../data/DDBEnricherData";
import { itemActivity } from "./_ItemActivities";

export default class MaceOfSmiting extends DDBEnricherData {

  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        duplicate: true,
        id: "ddbSmitingAtk001",
        overrides: {
          name: "Attack Construct",
          activationCondition: "Against a Construct",
          noConsumeTargets: true,
          damageParts: [DDBEnricherData.basicDamagePart({ bonus: "2", type: "bludgeoning" })],
          data: { attack: { bonus: "2" } },
        },
      },
      itemActivity("Natural 20 Damage", DDBEnricherData.ACTIVITY_TYPES.DAMAGE, {
        activationCondition: "A natural 20 against a target other than a Construct",
        targetType: "creature",
        targetCount: "1",
        rangeType: "any",
        data: {
          damage: { includeBase: false, parts: [DDBEnricherData.basicDamagePart({ bonus: "7", type: "bludgeoning" })] },
        },
      }),
      itemActivity("Natural 20 Construct Damage", DDBEnricherData.ACTIVITY_TYPES.DAMAGE, {
        activationCondition: "A natural 20 against a Construct; destroy it if it has 25 HP or fewer after this damage",
        targetType: "creature",
        targetCount: "1",
        rangeType: "any",
        data: {
          damage: {
            includeBase: false,
            parts: [DDBEnricherData.basicDamagePart({ bonus: "14", type: "bludgeoning" })],
          },
        },
      }),
    ];
  }

}
