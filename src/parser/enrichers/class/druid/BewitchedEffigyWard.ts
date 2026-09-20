import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * The effigy is an object set down within 30 feet, so its aura is a fixed 30-foot circle dropped
 * there, not an emanation on the druid. For the minute it stands, the druid and allies inside
 * gain 1 AC, applied to the targeted creatures as a one-minute effect. The parser already spends
 * the Wild Shape use.
 */
export default class BewitchedEffigyWard extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Create Effigy",
      targetType: "ally",
      activationType: "bonus",
      data: {
        target: {
          override: true,
          affects: { type: "ally" },
          template: { contiguous: false, type: "circle", size: "30", units: "ft" },
        },
        range: { override: true, value: "30", units: "ft" },
        duration: { override: true, value: "1", units: "minute" },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Bewitched Effigy: Ward",
        changes: [DDBEnricherData.ChangeHelper.addChange("1", 20, "system.attributes.ac.bonus")],
        // applied by hand to the druid and allies inside; remove it from a creature that leaves
        options: { durationSeconds: 60, description: "+1 bonus to AC while within the effigy's aura." },
      },
    ];
  }

}
