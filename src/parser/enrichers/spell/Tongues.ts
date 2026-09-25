import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Tongues: the target understands and can be understood in any spoken or signed language for the duration.
 */
export default class Tongues extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Universal Communication",
        changes: [
          DDBEnricherData.ChangeHelper.addChange("ALL", 20, "system.traits.languages.value"),
          DDBEnricherData.ChangeHelper.unsignedAddChange(";All spoken or signed languages", 20, "system.traits.languages.custom"),
        ],
      },
    ];
  }

}
