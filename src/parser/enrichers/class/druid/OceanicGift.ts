import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Oceanic Gift (Circle of the Sea, 2024): the DDB action "Grant Wrath of the Sea" gives the
 * emanation to a willing creature for one Wild Shape use; The action does not share the feature
 * name, so it is pulled in explicitly to attach the Wild Shape cost.
 */
export default class OceanicGift extends DDBEnricherData {

  override get useDefaultAdditionalActivities(): boolean {
    return false;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        action: {
          name: "Grant Wrath of the Sea",
          type: "class",
        },
        overrides: {
          addItemConsume: true,
          itemConsumeTargetName: "Wild Shape",
          data: {
            duration: {
              value: "10",
              units: "minute",
            },
          },
        },
      },
      {
        init: {
          name: "Grant Wrath of the Sea to Both",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          generateConsumption: true,
          generateDuration: true,
          generateUtility: true,
          activationOverride: {
            type: "bonus",
            value: null,
            condition: "Expend two uses of Wild Shape to manifest the emanation around you and the willing creature",
          },
          durationOverride: {
            value: "10",
            units: "minute",
          },
          targetOverride: {
            affects: {
              count: "1",
              type: "willing",
              choice: false,
              special: "",
            },
          },
        },
        overrides: {
          rangeType: "ft",
          rangeValue: 60,
          noTemplate: true,
          addItemConsume: true,
          itemConsumeTargetName: "Wild Shape",
          itemConsumeValue: 2,
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Stormborn",
        activitiesMatch: ["Grant Wrath of the Sea", "Grant Wrath of the Sea to Both"],
        changes: [
          DDBEnricherData.ChangeHelper.damageResistanceChange("cold"),
          DDBEnricherData.ChangeHelper.damageResistanceChange("lightning"),
          DDBEnricherData.ChangeHelper.damageResistanceChange("thunder"),
          DDBEnricherData.ChangeHelper.overrideChange("@attributes.movement.walk", 20, "system.attributes.movement.fly"),
        ],
        options: {
          durationSeconds: 600,
        },
      },
    ];
  }

}
