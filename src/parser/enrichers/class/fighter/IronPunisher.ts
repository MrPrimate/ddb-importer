import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Blade Breaker Iron Punisher stance: a toggled stance effect, and from 18th level a 2d6 bonus to
 * melee weapon damage, which DDB's action carries as dice the stances-known scale used to replace.
 */
export default class IronPunisher extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Iron Punisher Damage",
      targetType: "creature",
      activationType: "special",
      activationCondition: "In the Iron Punisher stance, you hit with a melee weapon attack",
      data: {
        damage: {
          parts: [DDBEnricherData.basicDamagePart({ number: 2, denomination: 6 })],
        },
        visibility: {
          identifier: "fighter",
          level: { min: 18, max: null },
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Stance: Iron Punisher",
        ignoreTransfer: true,
        options: {
          transfer: true,
          disabled: true,
          description: "While in this stance, your melee weapon attacks have advantage, but all attacks against you also have advantage.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.ruleAdvantageChange("attack", {
            conditions: DDBEnricherData.ChangeHelper.MELEE_WEAPON_ATTACK_FILTER,
          }),
        ],
        // the incoming-attack half modifies other creatures' rolls, which only midi can do
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.grants.advantage.attack.all"),
        ],
      },
    ];
  }

}
