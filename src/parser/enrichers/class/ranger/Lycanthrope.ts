import DDBEnricherData from "../../data/DDBEnricherData";

export default class Lycanthrope extends DDBEnricherData {

  static CLAW_ABILITIES = ["str", "dex"] as const;

  override get type(): IDDBActivityType | null {
    return null;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (this.isAction) return [];
    return Lycanthrope.CLAW_ABILITIES.map((ability) => {
      return {
        init: {
          name: `Claws (${ability === "str" ? "Str." : "Dex."})`,
          type: DDBEnricherData.ACTIVITY_TYPES.ATTACK,
        },
        build: {
          noeffect: true,
          generateActivation: true,
          generateAttack: true,
          generateRange: true,
          generateTarget: true,
          generateDamage: true,
          generateConsumption: false,
          allowCritical: true,
          activationOverride: {
            type: "action",
            value: 1,
            condition: "",
          },
          rangeOverride: {
            value: "5",
            units: "ft",
            special: "",
          },
          attackOverride: {
            ability,
            bonus: "",
            critical: {},
            flat: false,
            type: {
              value: "melee",
              classification: "unarmed",
            },
          },
          damageParts: [
            DDBEnricherData.basicDamagePart({
              number: 1,
              denomination: 6,
              bonus: "@mod",
              types: ["slashing"],
            }),
          ],
        },
      };
    });
  }

}
