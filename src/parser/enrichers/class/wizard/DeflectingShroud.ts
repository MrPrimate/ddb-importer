import DDBEnricherData from "../../data/DDBEnricherData";

export default class DeflectingShroud extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Bonus Damage",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
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
