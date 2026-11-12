import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Holy Bolt (Discipline Domain, World of Warcraft; the WoW Priest's Discipline Specialization): a
 * Bonus Action spending Channel Divinity for a 60-foot ranged spell attack (2d10 + Wis mod Radiant),
 * and on a hit 1d10 + Wis mod healing for a creature within 60 feet. DDB's healing action builds an
 * empty utility. Ultimate Penitence adds the Ascending Step teleport and the Ascending Volley, extra
 * bolts equal to the level of a spell slot spent with the Bonus Action.
 */
export default class HolyBolt extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.ATTACK;
  }

  // each bolt is its own 2d10 attack; the volley's slot level sets how many bolts, never the dice
  get boltDamage(): I5eDamagePart[] {
    return [DDBEnricherData.basicDamagePart({ number: 2, denomination: 10, bonus: "@abilities.wis.mod", types: ["radiant"], scalingMode: "none" })];
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Holy Bolt",
      activationType: "bonus",
      addItemConsume: true,
      itemConsumeTargetName: "Channel Divinity",
      targetType: "creature",
      data: {
        range: { units: "ft", value: "60" },
        attack: {
          ability: "wis",
          type: { value: "ranged", classification: "spell" },
        },
        damage: {
          includeBase: false,
          parts: this.boltDamage,
        },
      },
    };
  }

  override get useDefaultAdditionalActivities(): boolean {
    return false;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    const activities: IDDBAdditionalActivity[] = [
      {
        init: { name: "Holy Bolt: Healing", type: DDBEnricherData.ACTIVITY_TYPES.HEAL },
        build: {
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          generateHealing: true,
          generateConsumption: false,
          activationOverride: { type: "special", value: 1, condition: "When Holy Bolt hits" },
          targetOverride: { override: true, affects: { count: "1", type: "creature" } },
          rangeOverride: { units: "ft", value: "60" },
          healingPart: DDBEnricherData.basicDamagePart({ number: 1, denomination: 10, bonus: "@abilities.wis.mod", types: ["healing"] }),
        },
      },
    ];
    if (!this.hasClassFeature({ featureName: "Ultimate Penitence" })) return activities;
    activities.push(
      {
        init: { name: "Ascending Step", type: DDBEnricherData.ACTIVITY_TYPES.UTILITY },
        build: {
          generateActivation: true,
          generateRange: true,
          generateConsumption: false,
          activationOverride: { type: "special", value: 1, condition: "When you use Holy Bolt, before the attack roll" },
          rangeOverride: { units: "ft", value: "30" },
        },
      },
      {
        init: { name: "Ascending Volley", type: DDBEnricherData.ACTIVITY_TYPES.ATTACK },
        build: {
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          generateAttack: true,
          generateDamage: true,
          generateConsumption: true,
          includeBaseDamage: false,
          activationOverride: {
            type: "special",
            value: 1,
            condition: "As part of Holy Bolt's Bonus Action: one extra bolt per level of the spell slot spent, each its own attack roll",
          },
          targetOverride: { override: true, affects: { count: "1", type: "creature" } },
          rangeOverride: { units: "ft", value: "60" },
          attackOverride: {
            ability: "wis",
            type: { value: "ranged", classification: "spell" },
          },
          damageParts: this.boltDamage,
          consumptionOverride: {
            spellSlot: false,
            scaling: { allowed: true, max: "9" },
            targets: [{
              type: "spellSlots",
              value: "1",
              target: "1",
              scaling: { mode: "level", formula: "" },
            }],
          },
        },
      },
    );
    return activities;
  }

}
