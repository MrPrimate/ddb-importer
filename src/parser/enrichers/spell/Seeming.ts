import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Seeming: the appearance change is the utility; unwilling targets get the Charisma save and observers can Study the illusion. The parser already builds the save and the Study check.
 */
export default class Seeming extends DDBEnricherData {

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Change Appearance",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
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
            condition: "Choose a new appearance for each willing target",
          },
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Changed Appearance",
        activityMatch: "Change Appearance",
        options: {
          description: "Illusory appearance; a creature that takes the Study action can make an Intelligence (Investigation) check against the spell save DC to discern the disguise.",
        },
      },
    ];
  }

}
