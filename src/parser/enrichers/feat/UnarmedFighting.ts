import DDBEnricherData from "../data/DDBEnricherData";

/**
 * The Unarmed Strike's alternative damage (1d6 + Strength, a d8 while holding no weapons or
 * Shield) as attacks, and the start-of-turn 1d4 to a creature you are grappling.
 */
export default class UnarmedFighting extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.ATTACK;
  }

  #attackData(denomination: number): Partial<I5eActivity> {
    return {
      attack: {
        ability: "str",
        type: { value: "melee", classification: "unarmed" },
      },
      damage: {
        includeBase: false,
        parts: [DDBEnricherData.basicDamagePart({ number: 1, denomination, type: "bludgeoning", bonus: "@mod" })],
      },
    } as Partial<I5eActivity>;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Unarmed Strike (No Weapons or Shield)",
      targetType: "creature",
      activationType: "action",
      data: this.#attackData(8),
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: { name: "Unarmed Strike (Holding a Weapon or Shield)", type: DDBEnricherData.ACTIVITY_TYPES.ATTACK },
        build: {
          generateActivation: true,
          activationOverride: { type: "action", value: null, condition: "" },
          generateConsumption: false,
          generateTarget: true,
          targetOverride: { affects: { type: "creature", count: "1" } },
        },
        overrides: {
          data: this.#attackData(6),
        },
      },
      {
        init: { name: "Grapple Damage", type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE },
        build: {
          generateActivation: true,
          activationOverride: { type: "turnStart", value: null, condition: "One creature Grappled by you" },
          generateConsumption: false,
          generateDamage: true,
          damageParts: [DDBEnricherData.basicDamagePart({ number: 1, denomination: 4, type: "bludgeoning" })],
          generateTarget: true,
          targetOverride: { affects: { type: "creature", count: "1" } },
          noeffect: true,
        },
      },
    ];
  }

}
