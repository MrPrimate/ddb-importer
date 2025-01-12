/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class GreenFlameBlade extends DDBEnricherData {

  get type() {
    return this.useMidiAutomations ? "utility" : "none";
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
        constructor: {
          name: "Secondary Target Damage",
          type: "damage",
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
        constructor: {
          name: "Main Weapon Damage",
          type: "damage",
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
