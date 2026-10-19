import { utils } from "../../../../lib/_module";
import DDBEnricherData from "../../data/DDBEnricherData";

export default class FormOfTheBeastWeapons extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    const name = this.ddbParser.originalName;

    switch (name) {
      case "Form of the Beast: Tail (reaction)": {
        return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
      }
      // no default
    }
    return null;
  }

  override get activity(): IDDBActivityData | null {
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
          activationType: "reaction",
          targetType: "self",
          data: {
            roll: { prompt: false, visible: false, formula: "1d8", name: "AC Bonus" },
            // one effect per rolled result: Midi prompts for the one rolled rather than applying all eight
            midiProperties: { chooseEffects: true },
          },
        };
      }
      // no default
    }
    return null;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    const name = this.ddbParser.originalName;
    switch (name) {
      case "Form of the Beast: Bite": {
        return [
          {
            init: {
              name: "Bite (Healing Bonus - 1/your turn)",
              type: DDBEnricherData.ACTIVITY_TYPES.HEAL,
            },
            build: {
              generateConsumption: false,
              generateTarget: true,
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
            overrides: {
              targetSelf: true,
            },
          },
        ];
      }
      // no default
    }
    return [];
  }

  override get effects(): IDDBEffectHint[] {
    // dnd5e's ac.bonus resolves dice to 0, so the reaction rolls the d8 and the result's effect is applied
    if (this.ddbParser.originalName.startsWith("Form of the Beast: Tail")) {
      return Array.from({ length: 8 }, (_, i) => i + 1).map((value) => ({
        name: `Form of the Beast: Tail AC +${value}`,
        activityMatch: "Tail (reaction)",
        options: {
          expiry: "turnEnd",
        },
        daeSpecialDurations: ["isAttacked"],
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange(`${value}`, 1, "system.attributes.ac.bonus"),
        ],
        data: {
          flags: {
            dae: {
              selfTarget: true,
              selfTargetAlways: true,
            },
          },
        },
      }));
    }
    return [];
  }

  override get override(): IDDBOverrideData {
    return {
      data: {
        "system.properties": (this.hasClassFeature({ featureName: "Bestial Soul" })
          ? utils.addToProperties(this.data.system.properties, "mgc")
          : this.data.system.properties),
      },
    };
  }

  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get addToDefaultAdditionalActivities(): boolean {
    return true;
  }

}
