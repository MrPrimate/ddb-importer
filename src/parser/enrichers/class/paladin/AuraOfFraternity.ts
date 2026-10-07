import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Aura of Fraternity: you and allies in your Aura of Protection deal an extra 1d4 with melee weapons and Unarmed Strikes.
 * The damage activity is the manual fallback; with AC5e the paladin carries an aura that adds the die to melee weapon
 * damage rolls (Unarmed Strikes are melee weapon attacks in dnd5e). No damage type is given, so the bonus takes the
 * weapon's type as the text requires.
 */
export default class AuraOfFraternity extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Fraternal Strike",
      targetType: "creature",
      targetCount: 1,
      activationType: "special",
      activationCondition: "You or an ally in your Aura of Protection hits with a melee weapon or Unarmed Strike",
      noTemplate: true,
      data: {
        damage: { parts: [DDBEnricherData.basicDamagePart({ number: 1, denomination: 4, types: ["bludgeoning", "piercing", "slashing"] })] },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Aura of Fraternity",
        ac5eOnly: true,
        options: {
          transfer: true,
          description: "You and your allies in your Aura of Protection deal an extra 1d4 damage on attacks with melee weapons or Unarmed Strikes.",
        },
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange(
            "bonus=1d4; radius=(auraActor.classes.paladin.levels < 18 ? 10 : 30); allies; singleAura; includeSelf; actionType.mwak && !auraActor.statuses.incapacitated",
            20,
            "flags.automated-conditions-5e.aura.damage.bonus",
          ),
        ],
      },
    ];
  }

}
