import DDBEnricherData from "../data/DDBEnricherData";

/**
 * AU 2024: recover up to two expended slots of level 2 or lower (level 3 with a level 6 or 7 slot,
 * level 4 with level 8+). The cast keeps its default utility; one bookkeeping activity per
 * recoverable slot level restores a slot without spending one.
 */
export default class MordenkainensLucubration extends DDBEnricherData {

  static RECOVERABLE: { level: number; condition: string }[] = [
    { level: 1, condition: "After casting the spell" },
    { level: 2, condition: "After casting the spell" },
    { level: 3, condition: "After casting the spell with a level 6+ slot" },
    { level: 4, condition: "After casting the spell with a level 8+ slot" },
  ];

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return MordenkainensLucubration.RECOVERABLE.map(({ level, condition }) => ({
      init: {
        name: `Recover Level ${level} Slot`,
        type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
      },
      build: {
        generateActivation: true,
        generateConsumption: true,
        generateTarget: true,
        noSpellslot: true,
        activationOverride: { type: "special", value: null, condition },
        consumptionOverride: {
          scaling: { allowed: false, max: "" },
          targets: [
            { type: "attribute", target: `spells.spell${level}.value`, value: "-1", scaling: { mode: "", formula: "" } },
          ],
        },
      },
      overrides: {
        targetType: "self",
        removeSpellSlotConsume: true,
        noTemplate: true,
      },
    }));
  }

}
