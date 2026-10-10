import DDBEnricherData from "../data/DDBEnricherData";

/** The Magus Class cantrip: the same Psychic dice again the first time the target fails a D20 Test before the end of its next turn. */
export default class HatefulHaunting extends DDBEnricherData {

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Haunting Damage",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          generateDamage: true,
          generateConsumption: false,
          generateTarget: true,
          generateActivation: true,
          partialDamageParts: [0],
          activationOverride: { type: "special", value: null, condition: "The target first fails a D20 Test before the end of its next turn" },
        },
        overrides: {
          noeffect: true,
        },
      },
    ];
  }

}
