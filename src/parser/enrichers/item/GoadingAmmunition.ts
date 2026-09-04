import DDBEnricherData from "../data/DDBEnricherData";

/** Goading Arrows/Bolts/Needles/Bullets: a hit forces a save or the target loses its Reaction. */
export default class GoadingAmmunition extends DDBEnricherData {

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: { name: "Goad (Charisma Save)", type: DDBEnricherData.ACTIVITY_TYPES.SAVE },
        build: {
          generateSave: true,
          generateActivation: true,
          generateConsumption: false,
          saveOverride: { ability: ["cha"], dc: { calculation: "", formula: "13" } },
        },
        overrides: {
          targetType: "creature",
          activationType: "special",
          activationCondition: "When this ammunition hits and deals damage",
          noConsumeTargets: true,
          noTemplate: true,
          data: { range: { units: "spec" } },
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Goaded: No Reactions",
        activityMatch: "Goad (Charisma Save)",
        options: { expiry: "targetStart" },
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange("1", 20, "flags.midi-qol.noReaction"),
        ],
      },
    ];
  }

}
