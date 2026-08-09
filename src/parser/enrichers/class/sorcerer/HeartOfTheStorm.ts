import DDBEnricherData from "../../data/DDBEnricherData";

export default class HeartOfTheStorm extends DDBEnricherData {

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
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
