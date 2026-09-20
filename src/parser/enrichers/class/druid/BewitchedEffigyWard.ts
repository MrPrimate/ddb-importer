import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * The effigy is an object set down within 30 feet, so its aura is a fixed 30-foot circle dropped
 * there, not an emanation on the druid. For the minute it stands, the druid and allies inside
 * gain 1 AC. The parser already spends the Wild Shape use.
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
        behaviors: [
          DDBEnricherData.BehaviorHelper.applyEffect({ effects: "Bewitched Effigy: Ward" }),
        ],
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Bewitched Effigy: Ward",
        standalone: true,
        changes: [DDBEnricherData.ChangeHelper.addChange("1", 20, "system.attributes.ac.bonus")],
        // held only while inside: the region removes it on exit, so it carries no expiry of its own
        options: { expiry: null, durationSeconds: null, description: "+1 bonus to AC while within the effigy's aura." },
      },
    ];
  }

}
