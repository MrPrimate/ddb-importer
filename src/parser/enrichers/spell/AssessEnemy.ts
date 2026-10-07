import DDBEnricherData from "../data/DDBEnricherData";

/**
 * The Magus Class. For a minute the caster's attacks against the assessed creature score a
 * Critical Hit on 19-20 (AC5e scopes it to the caster; midi's grant applies to every attacker).
 * The damage-trait knowledge, Bloodied sight and the Reaction are text only.
 */
export default class AssessEnemy extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Assessed",
        options: {
          durationSeconds: 60,
          description: "The caster's attack rolls against this creature score a Critical Hit on a roll of 19 or 20. When it attacks the caster, the caster can use a Reaction to give the attack Disadvantage.",
        },
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange("set=19; effectOriginTokenId === tokenId;", 20, "flags.automated-conditions-5e.grants.attack.criticalThreshold"),
        ],
        midiChanges: [
          DDBEnricherData.ChangeHelper.overrideChange("19", 20, "flags.midi-qol.grants.criticalThreshold"),
        ],
      },
    ];
  }

}
