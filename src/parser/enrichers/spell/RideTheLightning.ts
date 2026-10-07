import DDBEnricherData from "../data/DDBEnricherData";

/**
 * The caster teleports along the line before the save, so the teleport is a separate
 * activity used as part of the casting. It does not read the cast level, so the extra 10 feet
 * per slot level above 4th is left in its condition.
 */
export default class RideTheLightning extends DDBEnricherData {

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Teleport",
          type: DDBEnricherData.ACTIVITY_TYPES.TELEPORT,
        },
        build: {
          noSpellslot: true,
          generateAttack: false,
          generateConsumption: true,
          generateDamage: false,
          generateDuration: true,
          generateRange: true,
          generateSave: false,
          generateTarget: true,
          activationOverride: {
            type: "special",
            condition: "As part of casting Ride the Lightning (+10 feet for each slot level above 4th)",
          },
          rangeOverride: {
            value: "60",
            units: "ft",
            special: "",
          },
          targetOverride: {
            prompt: false,
            affects: {
              count: "1",
              type: "self",
            },
            template: {},
          },
          durationOverride: {
            units: "inst",
            concentration: false,
          },
        },
        overrides: {
          noConsumeTargets: true,
          noSpellslot: true,
        },
      },
    ];
  }

}
