import DDBEnricherData from "../data/DDBEnricherData";

/**
 * World of Warcraft (Paladin): a Reaction granting Immunity to all damage until the start of the caster's next turn.
 */
export default class DivineShield extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Divine Shield",
        options: {
          expiry: "sourceStart",
          description: "Your Speed can't be reduced, current reductions are suspended, and no effect can move you against your will.",
        },
        changes: [
          // dnd5e 5.2 reads no "ALL" in damage traits, so every type is added
          ...DDBEnricherData.ChangeHelper.allDamageTypesChanges("system.traits.di.value"),
        ],
      },
    ];
  }

}
