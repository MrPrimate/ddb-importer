/* eslint-disable class-methods-use-this */
import { utils } from "../../../../lib/_module.mjs";
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class ElementalEpitome extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      name: "Elemental Attunement Effects",
      activationType: "special",
      activationCondition: "Become Elementally Attuned",
      targetType: "self",
      noTemplate: true,
    };
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Elemental Epitome Damage",
          type: "damage",
        },
        build: {
          generateDamage: true,
          generateActivation: true,
          generateConsumption: false,
          generateTarget: false,
          generateRange: false,
          damageParts: [
            DDBEnricherData.basicDamagePart({ customFormula: "@scale.monk.martial-arts.die", types: ["acid", "cold", "fire", "lightning", "thunder"] }),
          ],
        },
        overrides: {
          data: {
            target: {
              affects: {
                count: "1",
                type: "creature",
              },
            },
            range: {
              units: "self",
            },
          },
        },
      },
    ];
  }

  get effects() {
    const resistance = ["acid", "cold", "fire", "lightning", "thunder"].map((element) => {
      return {
        name: `${utils.capitalize(element)} Resistance`,
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange(element, 20, "system.traits.dr.value"),
        ],
        activityMatch: "Elemental Attunement Effects",
      };
    });
    const speed = {
      name: "Step of the Wind Bonus",
      changes: [
        DDBEnricherData.ChangeHelper.unsignedAddChange("20", 20, "system.attributes.speed.walk"),
      ],
      activityMatch: "Elemental Attunement Effects",
    };
    return [
      ...resistance,
      speed,
    ];
  }

}
