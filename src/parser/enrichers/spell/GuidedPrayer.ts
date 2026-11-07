import DDBEnricherData from "../data/DDBEnricherData";

/**
 * World of Warcraft (Paladin): after the heal, Advantage on the next attack roll before the end of the caster's next turn.
 */
export default class GuidedPrayer extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Guided Prayer",
        options: {
          expiry: "sourceEnd",
          description: "Advantage on the next attack roll you make.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.advantageAttackChange(),
        ],
      },
    ];
  }

}
