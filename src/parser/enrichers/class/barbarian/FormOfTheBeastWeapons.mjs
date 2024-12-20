/* eslint-disable class-methods-use-this */
import { utils } from "../../../../lib/_module.mjs";
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class FormOfTheBeastWeapons extends DDBEnricherData {

  get type() {
    const name = this.ddbParser.originalName;

    switch (name) {
      case "Form of the Beast: Tail (reaction)": {
        return "utility";
      }
      // no default
    }
    return null;
  }

  get activity() {
    const name = this.ddbParser.originalName;

    switch (name) {
      case "Form of the Beast: Tail": {
        return {
          name: "Tail Attack",
          noTemplate: true,
          data: {
            range: {
              value: 10,
              units: "ft",
            },
          },
        };
      }
      case "Form of the Beast: Claw": {
        return {
          name: "Claw Attack",
        };
      }
      case "Form of the Beast: Bite": {
        return {
          name: "Bite Attack",
        };
      }
      case "Form of the Beast: Tail (reaction)": {
        return {
          name: "Tail (reaction)",
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
              name: "Bite (Healing Bonus - 1/your turn)",
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
      // no default
    }
    return [];
  }

  get effects() {
    if (this.ddbParser.originalName.startsWith("Form of the Beast: Tail")) {
      return [
        {
          name: "Form of the Beast: Tail AC Bonus",
          activityMatch: "Tail (reaction)",
          options: {
            durationTurns: 1,
          },
          daeSpecialDurations: ["isAttacked"],
          changes: [
            DDBEnricherData.ChangeHelper.unsignedAddChange("+1d8", 1, "system.attributes.ac.bonus"),
          ],
          data: {
            flags: {
              dae: {
                selfTarget: true,
                selfTargetAlways: true,
              },
            },
          },
        },
      ];
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

  get useDefaultAdditionalActivities() {
    return true;
  }

  get addToDefaultAdditionalActivities() {
    return true;
  }

}
