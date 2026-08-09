import DDBEnricherData from "../../data/DDBEnricherData";

export default class PlanarWarrior extends DDBEnricherData {
  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
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

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Damage",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
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

  override get effects(): IDDBEffectHint[] {
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

  override get setMidiOnUseMacroFlag(): IDDBSetMidiOnUseMacroFlag {
    return {
      type: "feat",
      name: "planarWarrior.js",
      triggerPoints: ["postActiveEffects"],
    };
  }

  override get itemMacro(): IDDBItemMacro {
    return {
      type: "feat",
      name: "planarWarrior.js",
    };
  }
}
