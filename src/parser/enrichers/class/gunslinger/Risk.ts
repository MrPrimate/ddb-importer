import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Risk is the Gunslinger's resource pool (Risk Dice, a scaling dice pool
 * recovered on a short or long rest). The maneuvers themselves live on the
 * Maneuvers feature and consume this pool by name.
 */
export default class Risk extends DDBEnricherData {

  override get override(): IDDBOverrideData {
    return {
      data: {
        system: {
          uses: {
            spent: 0,
            max: "@scale.gunslinger.risk.number",
            recovery: [{ period: "sr", type: "recoverAll" }],
          },
        },
      },
    };
  }

}
