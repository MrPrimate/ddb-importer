import DDBEnricherData from "../../data/DDBEnricherData";

export default class SoulBladesPsychicTeleportation extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Roll Psychic Teleportation Distance",
      data: {
        img: "systems/dnd5e/icons/svg/trait-saves.svg",
        roll: {
          prompt: false,
          visible: false,
          formula: "@scale.soulknife.energy-die.die * 10",
          name: "Roll Distance Die (multiply by 10 feet)",
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Psychic Teleportation",
          type: DDBEnricherData.ACTIVITY_TYPES.TELEPORT,
        },
        build: {
          generateAttack: false,
          generateConsumption: false,
          generateDamage: false,
          generateDuration: true,
          generateRange: true,
          generateSave: false,
          generateTarget: true,
          activationOverride: {
            type: "special",
            condition: "After rolling Psychic Teleportation; stop at 10 times the rolled result in feet",
          },
          rangeOverride: {
            value: "10 * @scale.soulknife.energy-die.faces",
            units: "ft",
            special: "Maximum possible distance; use 10 times the rolled Psionic Energy Die result.",
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
          },
        },
        overrides: {
          noConsumeTargets: true,
        },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      ignoredConsumptionActivities: ["Plan Psychic Teleportation"],
    };
  }

}
