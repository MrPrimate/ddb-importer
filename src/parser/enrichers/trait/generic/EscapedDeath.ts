import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Escaped Death (Ravenloft lineages): advantage on death saving throws on a named transfer effect,
 * which replaces the one EffectGenerator builds from DDB's modifier.
 */
export default class EscapedDeath extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Escaped Death",
        options: {
          transfer: true,
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "system.attributes.death.roll.mode"),
        ],
      },
    ];
  }

}
