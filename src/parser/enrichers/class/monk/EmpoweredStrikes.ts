import DDBEnricherData from "../../data/DDBEnricherData";

export default class EmpoweredStrikes extends DDBEnricherData {
  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.ATTACK;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      data: {
        range: {
          value: 5,
          units: "ft",
        },
        attack: {
          ability: "dex",
          type: {
            value: "melee",
            classification: "unarmed",
          },
        },
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "@scale.monk.die.die + @mod",
              types: ["bludgeoning", "force"],
            }),
          ],
        },
      },
    };
  }

  override get clearAutoEffects() {
    return true;
  }
}
