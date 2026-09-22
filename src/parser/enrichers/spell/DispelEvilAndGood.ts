import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Dispel Evil and Good: the ward on the caster is a self effect; Break Enchantment ends possession or charm by touch. The Dismissal save comes from the parser.
 */
export default class DispelEvilAndGood extends DDBEnricherData {

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Ward Self",
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
            condition: "While the spell lasts, celestials, elementals, fey, fiends and undead have disadvantage on attacks against you",
          },
        },
        overrides: {
          targetType: "self",
          rangeSelf: true,
        },
      },
      {
        init: {
          name: "Break Enchantment",
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
            condition: "Touch a creature that is charmed, frightened or possessed by such a creature",
          },
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Dispel Evil and Good: Warded",
        activityMatch: "Ward Self",
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange("1", 20, "flags.midi-qol.grants.disadvantage.attack.all"),
        ],
        options: {
          description: "Celestials, Elementals, Fey, Fiends and Undead have Disadvantage on attack rolls against you and can't charm, frighten or possess you.",
        },
      },
    ];
  }

}
