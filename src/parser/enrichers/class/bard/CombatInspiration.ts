import DDBEnricherData from "../../data/DDBEnricherData";

export default class CombatInspiration extends DDBEnricherData {
  get type() {
    return "utility";
  }

  get activity() {
    return {
      targetType: "creature",
      data: {
        name: "Defense",
        roll: {
          prompt: false,
          visible: true,
          formula: "@scale.bard.inspiration",
          name: "Inspiration Roll",
        },
      },
    };
  }

  get additionalActivities() {
    return [
      {
        init: {
          name: "Damage",
          type: "damage",
        },
        build: {
          generateDamage: true,
          damageParts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "@scale.bard.inspiration",
            }),
          ],
        },
      },
    ];
  }
}
