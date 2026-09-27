import DDBEnricherData from "../../data/DDBEnricherData";

export default class Moxie extends DDBEnricherData {

  /**
   * One-Two Punch and Stick and Move are Unarmed Strikes. DDB's actions carry either no dice or
   * a flat 2d6, so use the Fisticuffs die the other Pugilist unarmed strike enrichers use.
   */
  get unarmedStrikeDamage(): I5eDamagePart {
    return DDBEnricherData.basicDamagePart({
      customFormula: "@scale.pugilist.fisticuffs + @abilities.str.mod",
      types: ["bludgeoning"],
    });
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        action: {
          name: "Brace Up",
          type: "class",
        },
        overrides: {
          addItemConsume: true,
        },
      },
      {
        action: {
          name: "One-Two Punch",
          type: "class",
        },
        overrides: {
          addItemConsume: true,
          data: {
            damage: {
              parts: [this.unarmedStrikeDamage],
            },
          },
        },
      },
      {
        action: {
          name: "Stick and Move",
          type: "class",
        },
        overrides: {
          addItemConsume: true,
          data: {
            damage: {
              parts: [this.unarmedStrikeDamage],
            },
          },
        },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      data: {
        // the Moxie scale counts points; it must not replace the Unarmed Strike damage
        flags: {
          ddbimporter: { skipScale: true },
        },
        system: {
          uses: {
            max: "@scale.pugilist.moxie",
          },
        },
      },
    };
  }

}
