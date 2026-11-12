import DDBEnricherData from "../data/DDBEnricherData";

/**
 * World of Warcraft (Evoker): a hit gives the target a -2 penalty to AC until the start of the caster's next turn.
 */
export default class ShatteringStar extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Shattering Star: Brittle",
        options: {
          expiry: "sourceStart",
        },
        changes: [
          DDBEnricherData.ChangeHelper.signedAddChange("-2", 20, "system.attributes.ac.bonus"),
        ],
      },
    ];
  }

}
