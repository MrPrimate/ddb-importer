import DDBEnricherData from "../../data/DDBEnricherData";

export default class Bite extends DDBEnricherData {

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.ATTACK;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Bite (Full Hit Points)",
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              number: 2,
              denomination: 6,
              types: ["necrotic"],
            }),
          ],
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        duplicate: true,
        overrides: {
          name: "Bite (Missing Hit Points)",
          data: {
            damage: {
              parts: [
                DDBEnricherData.basicDamagePart({
                  number: 2,
                  denomination: 10,
                  types: ["necrotic"],
                }),
              ],
            },
          },
        },
      },
    ];
  }

}
