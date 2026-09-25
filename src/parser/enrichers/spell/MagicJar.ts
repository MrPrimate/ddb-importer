import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Magic Jar: the transfer into the container, the possession save, and the return are separate activities; the possessed creature is trapped and Incapacitated.
 */
export default class MagicJar extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      name: "Possess Humanoid",
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Cast and Transfer Soul",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateDuration: true,
          durationOverride: {
            units: "inst",
            concentration: false,
          },
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          generateConsumption: false,
          noSpellslot: true,
          noeffect: true,
          generateUtility: true,
          activationOverride: {
            type: "action",
            value: null,
            condition: "Your soul leaves your body for the container",
          },
        },
      },
      {
        init: {
          name: "Return from Host",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateDuration: true,
          durationOverride: {
            units: "inst",
            concentration: false,
          },
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          generateConsumption: false,
          noSpellslot: true,
          noeffect: true,
          generateUtility: true,
          activationOverride: {
            type: "action",
            value: null,
            condition: "Return to the container or your own body",
          },
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Trapped Soul",
        activityMatch: "Possess Humanoid",
        statuses: ["Incapacitated"],
        // a Speed of 0 covers every movement mode, not only walking
        changes: [
          DDBEnricherData.ChangeHelper.customChange("*0", 20, "system.attributes.movement.all"),
          ...["walk", "fly", "swim", "climb", "burrow"].map((mode) =>
            DDBEnricherData.ChangeHelper.overrideChange("0", 60, `system.attributes.movement.${mode}`)),
        ],
        options: {
          durationSeconds: null,
          description: "The possessed creature's soul is trapped in the container until the spell ends or the container is destroyed.",
        },
      },
      {
        name: "Catatonic",
        activityMatch: "Cast and Transfer Soul",
        options: {
          durationSeconds: null,
          description: "Your body lies catatonic while your soul is in the container; if your body dies your soul must find a new host or the container within 1 round.",
        },
      },
    ];
  }

}
