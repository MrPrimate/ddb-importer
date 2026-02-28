import DDBEnricherData from "../../data/DDBEnricherData";

export default class EmpoweredStrikes extends DDBEnricherData {
  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.ATTACK;
  }

  get activity() {
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

  get clearAutoEffects() {
    return true;
  }
}
