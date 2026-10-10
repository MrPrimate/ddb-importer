import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Grim Hollow Accursed natural weapons: Unarmed Strikes deal 1d6 + Strength or Dexterity (the option
 * picked, "Natural Attack: Strength"/"Natural Attack: Dexterity") as Bludgeoning, Piercing or Slashing.
 */
export default class NaturalAttack extends DDBEnricherData {

  get ability(): T5eActivityAttackAbility {
    return (/dexterity/i).test(this.ddbParser.originalName) ? "dex" : "str";
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.ATTACK;
  }

  override get activity(): IDDBActivityData {
    return {
      name: `Natural Weapon (${this.ability === "dex" ? "Dexterity" : "Strength"})`,
      targetType: "creature",
      targetCount: 1,
      activationType: "action",
      data: {
        range: { override: true, value: "5", units: "ft" },
        attack: {
          ability: this.ability,
          type: { value: "melee", classification: "unarmed" },
        },
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              number: 1,
              denomination: 6,
              bonus: "@mod",
              types: ["bludgeoning", "piercing", "slashing"],
            }),
          ],
        },
      },
    };
  }

}
