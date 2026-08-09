import DDBEnricherData from "../../data/DDBEnricherData";

export default class PsionicStrike extends DDBEnricherData {
  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
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
