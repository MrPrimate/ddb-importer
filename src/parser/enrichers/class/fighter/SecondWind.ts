import DDBEnricherData from "../../data/DDBEnricherData";

export default class SecondWind extends DDBEnricherData {
  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      addItemConsume: true,
      targetType: "self",
      data: {
        healing: DDBEnricherData.basicDamagePart({
          number: 1,
          denomination: 10,
          bonus: "@classes.fighter.levels",
          types: ["healing"],
        }),
      },
    };
  }

  // Neko Duelist (OTFY) Cautious Tenacity: every Second Wind heal also grants the Dodge action
  override get effects(): IDDBEffectHint[] {
    if (!this.hasClassFeature({ featureName: "Cautious Tenacity", className: "Fighter" })) return [];
    if (this.ddbParser.isMuncher) return [];
    return [
      {
        name: "Cautious Tenacity: Dodging",
        options: {
          expiry: "sourceEnd",
        },
        statuses: ["dodging"],
      },
    ];
  }

  override get override(): IDDBOverrideData | null {
    if (!this.is2024) return null;
    const uses = foundry.utils.deepClone(this.data.system.uses);
    const recovery = foundry.utils.deepClone(uses.recovery ?? []);
    if (recovery.length === 0) recovery.push({ period: "lr", type: "recoverAll" });
    recovery.push({ period: "sr", type: "formula", formula: "1" });
    uses.recovery = recovery;
    return {
      uses,
    };
  }
}
