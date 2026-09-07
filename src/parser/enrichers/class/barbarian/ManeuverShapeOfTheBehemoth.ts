import DDBEnricherData from "../../data/DDBEnricherData";

export default class ManeuverShapeOfTheBehemoth extends DDBEnricherData {


  override get builtFeaturesFromActionFilters(): string[] {
    return ["Embody Behemoth", "Embody Behemoth: Bonus Weapon Damage", "Embody Behemoth: Temporary HP"];
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Embody Behemoth",
      activationType: "action",
      targetType: "self",
      data: {
        duration: {
          units: "minute",
          value: "1",
          concentration: true,
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Shape of the Behemoth",
        activityMatch: "Embody Behemoth",
        options: {
          durationSeconds: 60,
        },
        changes: [
          DDBEnricherData.ChangeHelper.overrideChange("lg", 20, "system.traits.size"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("1d6", 20, "system.bonuses.mwak.damage"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("1d6", 20, "system.bonuses.rwak.damage"),
        ],
        // dnd5e has no actor level reach attribute, so the +5 ft is AC5e's range surface
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange(
            "reach=+5",
            20,
            "flags.automated-conditions-5e.range",
          ),
        ],
      },
    ];
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Temporary Hit Points",
          type: "heal",
        },
        build: {
          generateHealing: true,
          generateTarget: true,
          generateActivation: true,
          generateConsumption: true,
          healingPart: DDBEnricherData.basicDamagePart({ number: 1, denomination: 6, type: "temphp" }),
        },
        overrides: {
          targetType: "self",
          activationType: "turnStart",
          activationCondition: "Start of your turn",
          noConsumeTargets: true,
        },
      },
    ];
  }

}
