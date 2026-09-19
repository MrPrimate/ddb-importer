import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Potion of Heroism: 10 temporary hit points and the Bless bonus for 1 hour.
 */
export default class PotionOfHeroism extends DDBEnricherData {
  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Drink",
      targetType: "self",
      rangeSelf: true,
      addItemConsume: true,
      data: { healing: DDBEnricherData.basicDamagePart({ customFormula: "10", types: ["temphp"] }) },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Blessed",
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1d4", 20, "system.bonuses.abilities.save"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("1d4", 20, "system.bonuses.mwak.attack"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("1d4", 20, "system.bonuses.msak.attack"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("1d4", 20, "system.bonuses.rwak.attack"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("1d4", 20, "system.bonuses.rsak.attack"),
        ],
        options: {
          transfer: false,
          durationSeconds: 3600,
        },
      },
    ];
  }

}
