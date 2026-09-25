import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Perfume of Bewitching: advantage on Charisma (Persuasion) and (Deception) checks for 1 hour.
 */
export default class PerfumeOfBewitching extends DDBEnricherData {
  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Bewitching Scent",
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "system.skills.per.roll.mode"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "system.skills.dec.roll.mode"),
        ],
        options: {
          transfer: false,
          durationSeconds: 3600,
        },
      },
    ];
  }

}
