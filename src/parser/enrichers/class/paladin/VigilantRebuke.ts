import DDBEnricherData from "../../data/DDBEnricherData";

export default class VigilantRebuke extends DDBEnricherData {

  // the creature that forced the saving throw takes the damage outright; it makes no save
  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "enemy",
      activationType: "reaction",
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              number: 2,
              denomination: 8,
              bonus: "@abilities.cha.mod",
              types: ["force"],
            }),
          ],
        },
      },
    };
  }

}
