import DDBEnricherData from "../data/DDBEnricherData";

/**
 * The 2024 Rings of Elemental Command ("Ring of Elemental Command (Air)" and its siblings). The
 * Compulsion is free and aims at one Elemental: a DC 18 Wisdom save or Charmed until the start of
 * the wearer's next turn. Elemental Bane is advantage on attacks against Elementals and
 * disadvantage on theirs against the wearer, which only AC5e can scope to a creature type. The
 * language, damage and speed properties and the casts come from DDB's own modifiers and spells.
 * The 2014 rings name an elemental of one plane, which a creature type cannot tell apart, so they
 * keep the default parse.
 */
export default class RingOfElementalCommand extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return this.is2014 ? null : DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData | null {
    if (this.is2014) return null;
    return {
      name: "Elemental Compulsion",
      activationType: "action",
      noConsumeTargets: true,
      noTemplate: true,
      data: {
        range: { override: true, value: "60", units: "ft" },
        target: {
          override: true,
          affects: { count: "1", type: "creature", special: "Elemental you can see" },
        },
        save: { ability: ["wis"], dc: { calculation: "", formula: "18" } },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    if (this.is2014) return [];
    return [
      {
        name: "Elemental Compulsion: Charmed",
        activityMatch: "Elemental Compulsion",
        statuses: ["Charmed"],
        options: {
          transfer: false,
          expiry: "sourceStart",
          description: "Charmed until the start of the ring wearer's next turn, who decides what you do with your move and action on your next turn.",
        },
      },
      {
        name: "Elemental Bane",
        ac5eOnly: true,
        options: {
          transfer: true,
          description: "You have Advantage on attack rolls against Elementals and they have Disadvantage on attack rolls against you.",
        },
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange(
            "opponentActor.creatureType.includes('elemental')",
            20,
            "flags.automated-conditions-5e.attack.advantage",
          ),
          DDBEnricherData.ChangeHelper.ac5eChange(
            "rollingActor.creatureType.includes('elemental')",
            20,
            "flags.automated-conditions-5e.grants.attack.disadvantage",
          ),
        ],
      },
    ];
  }

}
