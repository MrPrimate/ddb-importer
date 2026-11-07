import DDBEnricherData from "../data/DDBEnricherData";

/**
 * World of Warcraft (Evoker): the willing target gains +1 AC while its explosive scales last.
 */
export default class BlisteringScales extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Blistering Scales",
        options: {
          durationSeconds: 60,
          description: "When a creature hits you with a melee attack roll, a scale explodes and it takes 1d8 Fire damage. The spell ends when no scales remain.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.signedAddChange("1", 20, "system.attributes.ac.bonus"),
        ],
      },
    ];
  }

}
