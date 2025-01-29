/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class PlanarWarrior extends DDBEnricherData {
  get type() {
    return "utility";
  }

  get activity() {
    return {
      name: "Mark Target",
      activationType: "bonus",
      targetType: "creature",
      data: {
        range: {
          units: "ft",
          value: "30",
        },
        midiProperties: {
          ignoreTraits: [],
          triggeredActivityId: "none",
          triggeredActivityConditionText: "",
          triggeredActivityTargets: "targets",
          triggeredActivityRollAs: "self",
          forceDialog: false,
          confirmTargets: "default",
          automationOnly: false,
          identifier: "mark",
          otherActivityCompatible: false,
        },
      },
    };
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Damage",
          type: "damage",
        },
        build: {
          generateDamage: true,
          generateRange: true,
          generateActivation: true,
          generateTarget: true,
        },
        overrides: {
          activationType: "special",
          activationCondition: "Hit marked creature this turn with a weapon attack",
          targetType: "creature",
          data: {
            range: {
              units: "ft",
              value: "30",
            },
            damage: {
              parts: [
                DDBEnricherData.basicDamagePart({
                  customFormula: "@scale.horizon-walker.planar-warrior",
                  type: "force",
                }),
              ],
            },
          },
        },
      },
    ];
  }

  get effects() {
    return [
      {
        name: "Marked by Planar Warrior",
        activityMatch: "Mark Target",
        options: {
          durationTurns: 1,
        },
      },
    ];
  }

  get setMidiOnUseMacroFlag() {
    return {
      type: "feat",
      name: "planarWarrior.js",
      triggerPoints: ["postActiveEffects"],
    };
  }

  get itemMacro() {
    return {
      type: "feat",
      name: "planarWarrior.js",
    };
  }
}
