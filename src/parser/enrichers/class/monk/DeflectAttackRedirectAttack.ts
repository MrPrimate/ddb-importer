import DDBEnricherData from "../../data/DDBEnricherData";

export default class DeflectAttackRedirectAttack extends DDBEnricherData {
  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  get activity() {
    return {
      name: "Redirect Attack",
      targetType: "creature",
      addItemConsume: true,
      activationType: "special",
      type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
      data: {
        save: {
          ability: ["dex"],
          dc: { calculation: "dex", formula: "" },
        },
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "@scale.monk.deflect-attacks + @abilities.dex.mod",
              types: ["bludgeoning", "piercing", "slashing"],
            }),
          ],
        },
      },
    };
  }

  get override() {
    return {
      data: {
        flags: {
          ddbimporter: {
            skipScale: true,
          },
        },
      },
    };
  }
}
