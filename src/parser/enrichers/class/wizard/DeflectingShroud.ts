import DDBEnricherData from "../../data/DDBEnricherData";

export default class DeflectingShroud extends DDBEnricherData {

  get type() {
    return "none";
  }

  get additionalActivities() {
    return [
      {
        init: {
          name: "Bonus Damage",
          type: "damage",
        },
        build: {
          noeffect: true,
          generateConsumption: false,
          generateTarget: true,
          generateRange: true,
          generateActivation: true,
          generateDamage: true,
          activationOverride: {
            type: "special",
            condition: "Use Arcane Deflection",
          },
          damageParts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "floor(@classes.wizard.level / 2)",
              types: ["force"],
            }),
          ],
        },
        overrides: {
        },
      },
    ];
  }


}
