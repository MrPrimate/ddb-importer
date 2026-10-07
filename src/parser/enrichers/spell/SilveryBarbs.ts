import DDBEnricherData from "../data/DDBEnricherData";

/**
 * The reaction forces the triggering creature to reroll; the caster then grants Advantage on the
 * next d20 Test another creature makes within 1 minute. That grant is its own activity so the
 * effect lands on the ally rather than the creature forced to reroll. AC5e's "once" removes the
 * effect after the first roll it applies to.
 */
export default class SilveryBarbs extends DDBEnricherData {

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Ally Advantage",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateConsumption: false,
          generateTarget: true,
          generateActivation: true,
          generateRange: true,
          noSpellslot: true,
          activationOverride: {
            type: "special",
            value: null,
            condition: "After the reroll, choose a creature you can see within 60 feet",
          },
          rangeOverride: { units: "ft", value: 60 },
          targetOverride: {
            override: true,
            affects: { count: "1", type: "creature", choice: false, special: "" },
            template: {},
          },
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Silvery Barbs: Advantage",
        activityMatch: "Ally Advantage",
        options: {
          durationSeconds: 60,
          description: "Advantage on the next attack roll, ability check or saving throw within 1 minute.",
        },
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange("once", 20, "flags.automated-conditions-5e.d20.advantage"),
        ],
      },
    ];
  }

}
