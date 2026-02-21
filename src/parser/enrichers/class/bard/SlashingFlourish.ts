import DDBEnricherData from "../../data/DDBEnricherData";

export default class SlashingFlourish extends DDBEnricherData {

  get type() {
    return "damage";
  }

  get activity() {
    return {
      name: "Slashing Flourish: Damage Bonus",
      targetType: "creature",
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "@scale.bard.inspiration",
              types: DDBEnricherData.allDamageTypes(),
            }),
          ],
        },
      },
    };
  }

}
