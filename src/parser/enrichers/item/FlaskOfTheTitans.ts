import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Flask of the Titans (World of Warcraft): the drinker's Hit Point maximum and current Hit Points
 * increase by 30 for 1 hour (a temporary maximum effect plus the matching heal).
 */
export default class FlaskOfTheTitans extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Drink",
      targetType: "self",
      rangeSelf: true,
      activationType: "bonus",
      addItemConsume: true,
      data: { healing: DDBEnricherData.basicDamagePart({ customFormula: "30", types: ["healing"] }) },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Flask of the Titans",
        options: { transfer: false, durationSeconds: 3600 },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("30", 20, "system.attributes.hp.tempmax"),
        ],
      },
    ];
  }

}
