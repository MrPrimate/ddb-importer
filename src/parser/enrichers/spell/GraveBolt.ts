import DDBEnricherData from "../data/DDBEnricherData";

/** The Magus Class: an Undead target regains the 1d8 (plus 1d8 per slot level above 1) instead of taking it as Necrotic damage. */
export default class GraveBolt extends DDBEnricherData {

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Heal Undead",
          type: DDBEnricherData.ACTIVITY_TYPES.HEAL,
        },
        build: {
          generateHealing: true,
          generateConsumption: true,
          generateTarget: true,
          generateRange: true,
          generateActivation: true,
          healingPart: DDBEnricherData.basicDamagePart({
            number: 1,
            denomination: 8,
            types: ["healing"],
            scalingMode: "whole",
            scalingNumber: 1,
          }),
        },
        overrides: {
          targetType: "creature",
          targetCount: 1,
          activationCondition: "The target is Undead",
          noeffect: true,
        },
      },
    ];
  }

}
