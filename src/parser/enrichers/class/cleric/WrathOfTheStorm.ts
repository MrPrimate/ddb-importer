import DDBEnricherData from "../../data/DDBEnricherData";

export default class WrathOfTheStorm extends DDBEnricherData {

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      data: {
        damage: {
          onSave: "half",
          parts: [
            DDBEnricherData.basicDamagePart({
              number: 2,
              denomination: 8,
              types: ["thunder", "lightning"],
            }),
          ],
        },
      },
    };
  }
}
