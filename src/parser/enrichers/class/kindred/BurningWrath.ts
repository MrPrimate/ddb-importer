import DDBEnricherData from "../../data/DDBEnricherData";

export default class BurningWrath extends DDBEnricherData {

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "bonus",
      addItemConsume: true,
      itemConsumeTargetName: "Blood Potency",
      itemConsumeValue: "2",
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Burning Wrath",
        options: {
          durationSeconds: 60,
          description: "Unarmed Strikes deal an extra 2d8 Necrotic damage. Ends after 1 minute or when you fail to attack an enemy on your turn.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("2d8[necrotic]", 20, "system.bonuses.mwak.damage"),
        ],
      },
    ];
  }

}
