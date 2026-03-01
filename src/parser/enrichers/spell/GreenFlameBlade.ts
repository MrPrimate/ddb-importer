import DDBEnricherData from "../data/DDBEnricherData";

export default class GreenFlameBlade extends DDBEnricherData {

  get type() {
    return this.useMidiAutomations ? DDBEnricherData.ACTIVITY_TYPES.UTILITY : DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  get activity() {
    return {
      name: "Cast Spell (Automation)",
      targetType: "creature",
      overrideTemplate: true,
      overrideRange: true,
      noTemplate: true,
      data: {
        range: {
          override: true,
          units: "ft",
          value: "5",
        },
      },
    };
  }

  get additionalActivities() {
    return [
      {
        init: {
          name: "Secondary Target Damage",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          generateDamage: true,
          generateConsumption: false,
          damageParts: [
            DDBEnricherData.basicDamagePart({
              bonus: "@mod",
              types: ["fire"],
              scalingMode: "whole",
              scalingFormula: "1d8",
            }),
          ],
        },
      },
      {
        init: {
          name: "Main Weapon Damage",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          generateDamage: true,
          generateConsumption: false,
          damageParts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "(ceil((@details.level+1)/6))d8",
              types: ["fire"],
              scalingMode: "none",
            }),
          ],
        },
        overrides: {
          data: {
            damage: {
              critical: {
                allow: true,
              },
            },
          },
        },
      },
    ];
  }

  get override() {
    return {
      data: {
        "system.range": {
          value: "5",
          units: "ft",
        },
        "system.target.template": {
          size: "",
          type: "",
        },
      },
    };
  }

  get itemMacro() {
    return {
      type: "spell",
      name: "greenFlameBlade.js",
    };
  }

  get setMidiOnUseMacroFlag() {
    return {
      type: "spell",
      name: "greenFlameBlade.js",
      triggerPoints: ["postActiveEffects"],
    };
  }

}
