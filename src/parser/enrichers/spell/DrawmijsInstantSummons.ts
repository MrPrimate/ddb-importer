import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Drawmij's Instant Summons: the cast inscribes the sapphire; a later action recalls the object.
 */
export default class DrawmijsInstantSummons extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      name: "Inscribe Mark",
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Recall Object",
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
            condition: "Crush the sapphire to transport the object to your hand",
          },
        },
      },
    ];
  }

}
