import DDBEnricherData from "../../data/DDBEnricherData";

export default class HeartOfTheStorm extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  get activity() {
    return {
      name: "Damage",
      noeffect: true,
      targetType: "enemy",
      activationType: "special",
      data: {
        range: {
          value: "10",
          units: "ft",
        },
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "@classes.sorcerer.levels",
              types: ["lightning", "thunder"],
            }),
          ],
        },
      },
    };
  }
}
