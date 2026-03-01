import DDBEnricherData from "../../data/DDBEnricherData";

export default class PsionicStrike extends DDBEnricherData {
  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  get activity() {
    return {
      name: "Psionic Strike",
      activationType: "special",
      type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
      targetType: "creature",
      addItemConsume: true,
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "@scale.psi-warrior.energy-die.die + @abilities.mod.int",
              types: ["psychic"],
            }),
          ],
        },
        range: {
          units: "ft",
          value: "30",
        },
      },
    };
  }

}
