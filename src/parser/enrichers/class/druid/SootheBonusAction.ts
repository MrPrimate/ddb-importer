import DDBEnricherData from "../../data/DDBEnricherData";

/** Circle of Wicker Bewitched Effigy, Soothe aura: a creature in the aura regains 1d6 Hit Points, twice your spellcasting modifier times per effigy. */
export default class SootheBonusAction extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      targetCount: 1,
      noTemplate: true,
      activationType: "bonus",
      activationCondition: "When you create the effigy, and on later turns while it remains",
      addItemConsume: true,
      data: {
        healing: DDBEnricherData.basicDamagePart({ number: 1, denomination: 6, types: ["healing"] }),
      },
    };
  }

}
