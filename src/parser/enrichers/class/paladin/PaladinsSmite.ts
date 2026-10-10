import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Paladin (2024) level 2: Divine Smite is always prepared and can be cast once per Long Rest
 * without a spell slot. The free cast is this activity; DDB's slot-less copy of the spell is
 * dropped by FEATURE_SPELLS_IGNORE while the always-prepared copy stays in the spellbook.
 */
export default class PaladinsSmite extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.CAST;
  }

  override get activity(): IDDBActivityData {
    return {
      addSpellUuid: "Divine Smite",
      addItemConsume: true,
      noSpellslot: true,
      data: {
        spell: {
          spellbook: true,
        },
      },
    };
  }

  override get override(): IDDBOverrideData {
    return {
      uses: this._getSpellUsesWithSpent({
        type: "class",
        name: "Paladin's Smite",
        max: "1",
        period: "lr",
      }),
    };
  }

  /**
   * AC5e damage opt-in standing in for the free cast after a hit: it spends this feature's use at
   * 1st level, once per turn and on your turn (the spell takes a bonus action). Picking a spell
   * slot in the roll dialog needs AC5e's slot pools, which only ship for dnd5e 6, so slot smites
   * stay casts of the spell here.
   */
  override get effects(): IDDBEffectHint[] {
    const fiendOrUndead = "(opponentActor.creatureType.includes('fiend') || opponentActor.creatureType.includes('undead'))";
    const condition = "actionType.mwak && (!combat.active || isTurn)";
    return [
      {
        name: "Divine Smite (Automation)",
        ac5eOnly: true,
        options: {
          transfer: true,
          description: "Optional extra radiant damage on a melee weapon or Unarmed Strike hit, spending the free use of Paladin's Smite in place of casting Divine Smite.",
        },
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange(
            `bonus=(${fiendOrUndead} ? 3 : 2)d8[radiant]; usesCount=Item.paladins-smite; name=Divine Smite (Paladin's Smite); oncePerTurn; optin; ${condition}`,
            20,
            "flags.automated-conditions-5e.damage.bonus",
          ),
        ],
      },
    ];
  }

}
