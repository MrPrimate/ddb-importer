import DDBEnricherData from "../data/DDBEnricherData";

/**
 * See Invisibility: the caster sees Invisible creatures and objects and into the Ethereal Plane for the duration.
 */
export default class SeeInvisibility extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "See Invisibility",
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange(";Invisible creatures", 20, "system.attributes.senses.special"),
          DDBEnricherData.ChangeHelper.unsignedAddChange(";Ethereal Plane", 20, "system.attributes.senses.special"),
        ],
        // The spell has no range limit beyond sight; detection mode ranges must be finite.
        tokenChanges: DDBEnricherData.ChangeHelper.detectionModeChanges("seeInvisibility", 5280),
      },
    ];
  }

}
