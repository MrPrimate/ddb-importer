import DDBEnricherData from "../data/DDBEnricherData";

/** The Magus Class cantrip: after a hit, a Reaction before the caster's next turn subtracts 1d4 from the target's next D20 Test. */
export default class MisfortunateMissile extends DDBEnricherData {

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Misfortune",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
          noSpellslot: true,
          activationOverride: { type: "reaction", value: 1, condition: "Immediately after the target you hit makes a D20 Test, before the start of your next turn" },
          rollOverride: {
            prompt: false,
            visible: true,
            formula: "1d4",
            name: "Subtract from the roll",
          },
        },
        overrides: {
          targetType: "creature",
          targetCount: 1,
          noeffect: true,
        },
      },
    ];
  }

}
