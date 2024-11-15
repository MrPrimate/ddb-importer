/* eslint-disable class-methods-use-this */
import { utils } from "../../../../lib/_module.mjs";
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class FormOfTheBeast extends DDBEnricherData {

  get activity() {
    const name = this.ddbParser.originalName;

    switch (name) {
      case "Form of the Beast: Tail": {
        return {
          noTemplate: true,
          data: {
            range: {
              value: 10,
              units: "ft",
            },
          },
        };
      }
      // no default
    }
    return null;
  }

  get additionalActivities() {
    const name = this.ddbParser.originalName;
    switch (name) {
      case "Form of the Beast: Bite": {
        return [
          {
            constructor: {
              name: "Healing Bonus (1/your turn)",
              type: "heal",
            },
            build: {
              generateConsumption: false,
              generateTarget: true,
              targetSelf: true,
              generateRange: false,
              generateActivation: true,
              generateDamage: false,
              generateHealing: true,
              activationOverride: {
                type: "special",
                value: 1,
                condition: "",
              },
              healingPart: DDBEnricherData.basicDamagePart({ customFormula: "@prof", type: "healing" }),
            },
          },
        ];
      }
      case "Form of the Beast: Tail": {
        return [
          {
            constructor: {
              name: "Reactive Attack",
              type: "attack",
            },
            build: {
              noTemplate: true,
              generateConsumption: false,
              generateTarget: true,
              generateRange: false,
              generateActivation: true,
              generateDamage: true,
              generateAttack: true,
              activationOverride: {
                type: "reaction",
                value: 1,
                condition: "",
              },
            },
          },
        ];
      }
      // no default
    }
    return [];
  }

  get override() {
    return {
      data: {
        "system.properties": (this.hasClassFeature({ featureName: "Bestial Soul" })
          ? utils.addToProperties(this.data.system.properties, "mgc")
          : this.data.system.properties),
      },
    };
  }

}
