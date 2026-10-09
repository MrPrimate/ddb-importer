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
   * AC5e damage opt-ins standing in for casting the spell after a hit: one spends a spell or Pact
   * slot picked in the roll dialog and scales from its level, the other spends this feature's free
   * use at 1st level. Both need the bonus action, so they are once per turn and on your turn, and
   * each hides while the other is selected so one hit cannot take both.
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
          description: "Optional extra radiant damage on a melee weapon or Unarmed Strike hit, in place of casting Divine Smite: expend a spell slot of your choice, or the free use of Paladin's Smite. Needs Automated Conditions 5e 14.605.2 or later.",
        },
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange(
            `bonus=(${fiendOrUndead} ? (2 + optinScale) : (1 + optinScale))d8[radiant]; usesCount=spell[slot,pact],{min:1,max:9,step:1}; name=Divine Smite; optinId=divine-smite; oncePerTurn; optin; !optinSelected['divine-smite-free'] && ${condition}`,
            20,
            "flags.automated-conditions-5e.damage.bonus",
          ),
          DDBEnricherData.ChangeHelper.ac5eChange(
            `bonus=(${fiendOrUndead} ? 3 : 2)d8[radiant]; usesCount=Item.paladins-smite; name=Divine Smite (Paladin's Smite); optinId=divine-smite-free; oncePerTurn; optin; !optinSelected['divine-smite'] && ${condition}`,
            20,
            "flags.automated-conditions-5e.damage.bonus",
          ),
        ],
      },
    ];
  }

}
