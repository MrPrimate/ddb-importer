import DDBEnricherData from "../data/DDBEnricherData";

export default class DisciplinePotence extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  get activity(): IDDBActivityData {
    return {
      name: "Potence: Extra Damage",
      targetType: "creature",
      activationType: "special",
      activationCondition: "When you hit with a Melee weapon or Unarmed Strike as part of the Attack action on your turn",
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              bonus: "@prof",
              types: ["bludgeoning", "piercing", "slashing"],
            }),
          ],
        },
      },
    };
  }

}
