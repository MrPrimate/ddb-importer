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
          bonus: `@classes.${this.classIdentifier("Fighter")}.levels`,
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
    // 2024 recovers fully on a Long Rest and one use on a Short Rest. Any short rest entry already
    // read from the text or DDB's reset type is replaced rather than added to.
    const recovery = ((uses.recovery ?? []) as I5eSystemLimitedUsesRecovery[]).filter((r) => r.period !== "sr");
    if (!recovery.some((r) => r.period === "lr")) recovery.push({ period: "lr", type: "recoverAll" });
    recovery.push({ period: "sr", type: "formula", formula: "1" });
    uses.recovery = recovery;
    return {
      uses,
    };
  }
}
