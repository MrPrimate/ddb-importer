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
          // "before the end of the caster's next turn"
          expiry: "sourceEnd",
          description: "Advantage on the next attack roll you make before the end of the caster's next turn. Without DAE or AC5e the effect lasts for every attack until then.",
        },
        // DAE and AC5e each end the effect after the one attack; the native expiry is the ceiling
        daeSpecialDurations: ["1Attack"],
        daeStackable: "noneName",
        changes: [
          DDBEnricherData.ChangeHelper.advantageAttackChange(),
        ],
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange("once; 1", 20, "flags.automated-conditions-5e.attack.advantage"),
        ],
      },
    ];
  }

}
