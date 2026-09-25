import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Energy Bow: the transport and ladder utilities; the parser builds the restraint save.
 */
export default class EnergyBow extends DDBEnricherData {
  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Arrow of Transport",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          generateUtility: true,
          activationOverride: { type: "action", value: null, condition: "Teleport the target to an unoccupied space within 10 feet of the point where the arrow lands" },
          targetOverride: {
            affects: { count: "1", type: "creatureOrObject", choice: false, special: "" },
          },
        },
        overrides: {
          rangeType: "ft",
          rangeValue: 60,
          noTemplate: true,
        },
      },
      {
        init: {
          name: "Energy Ladder",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          generateUtility: true,
          activationOverride: { type: "action", value: null, condition: "" },
          targetOverride: {
            template: { type: "wall", size: "3", width: "2", units: "ft", count: "" },
            affects: { count: "", type: "object", choice: false, special: "" },
          },
        },
        overrides: {
          rangeType: "ft",
          rangeValue: 60,
        },
      },
    ];
  }

}
