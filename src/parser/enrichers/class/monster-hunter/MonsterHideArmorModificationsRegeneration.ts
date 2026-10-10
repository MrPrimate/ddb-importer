import DDBEnricherData from "../../data/DDBEnricherData";

/** Trapper Guild armor modification: a pool of six d10s; a Bonus Action spends one to heal the roll plus your Constitution modifier. */
export default class MonsterHideArmorModificationsRegeneration extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Regenerate",
      targetType: "self",
      activationType: "bonus",
      addItemConsume: true,
      data: {
        healing: DDBEnricherData.basicDamagePart({ number: 1, denomination: 10, bonus: "@abilities.con.mod", types: ["healing"] }),
      },
    };
  }

  override get useDefaultAdditionalActivities(): boolean {
    return false;
  }

}
