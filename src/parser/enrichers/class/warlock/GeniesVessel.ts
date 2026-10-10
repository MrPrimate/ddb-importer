import DDBEnricherData from "../../data/DDBEnricherData";

export default class GeniesVessel extends DDBEnricherData {
  override get type(): IDDBActivityType | null {
    if (this.ddbParser.originalName === "Genie's Vessel") return DDBEnricherData.ACTIVITY_TYPES.NONE;
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData | null {
    const types = [];
    if (this.ddbParser.originalName.includes("Dao")) types.push("bludgeoning");
    else if (this.ddbParser.originalName.includes("Djinni")) types.push("thunder");
    else if (this.ddbParser.originalName.includes("Efreeti")) types.push("fire");
    else if (this.ddbParser.originalName.includes("Marid")) types.push("cold");
    else return null;
    return {
      targetType: "creature",
      activationType: "special",
      addItemConsume: true,
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "@prof",
              types,
            }),
          ],
        },
      },
    };
  }

  /**
   * Genie's Wrath is "once during each of your turns": one use refilled at the start of your own turn
   * (`turn` would refill on every combatant's turn). The option otherwise inherits Bottled Respite's
   * long-rest use.
   */
  override get override(): IDDBOverrideData | null {
    if (!this.ddbParser.originalName.includes("Wrath")) return null;
    return { uses: { spent: null, max: "1", recovery: [{ period: "turnStart", type: "recoverAll" }] } };
  }

  override get effects(): IDDBEffectHint[] {
    let type = null;
    if (this.ddbParser.originalName.includes("Dao")) type = "bludgeoning";
    else if (this.ddbParser.originalName.includes("Djinni")) type = "thunder";
    else if (this.ddbParser.originalName.includes("Efreeti")) type = "fire";
    else if (this.ddbParser.originalName.includes("Marid")) type = "cold";
    if (!type) return [];
    return [
      {
        name: "Genie's Wrath (Automation)",
        ac5eOnly: true,
        options: {
          transfer: true,
          description: "Optional once per turn extra damage when you hit with an attack roll.",
        },
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange(
            `bonus=@prof[${type}]; oncePerTurn; optin; hasAttack`,
            20,
            "flags.automated-conditions-5e.damage.bonus",
          ),
        ],
      },
    ];
  }
}
