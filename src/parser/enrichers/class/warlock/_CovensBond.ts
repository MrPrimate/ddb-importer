import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Coven Patron (OTFY) "Coven's Bond: <Coven>" option documents. Forging the bond is a Bonus Action
 * once per Long Rest; the coven's bond effect is then usable Charisma modifier times (minimum once)
 * while the bond lasts, tracked on its own activity uses.
 */
export default class _CovensBond extends DDBEnricherData {

  /** "damage" (Crowsworn, Fish Head), "save" (Cloud Cap, The Tall Hats) or "teleport" (Gilded Gourd, Patchwork Robe) */
  get bondKind(): "damage" | "save" | "teleport" {
    const name = this.ddbParser.originalName;
    if ((/Crowsworn|Fish Head/i).test(name)) return "damage";
    if ((/Cloud Cap|Tall Hats/i).test(name)) return "save";
    return "teleport";
  }

  get bondTarget(): string {
    return this.bondKind === "damage" ? "an enemy" : "a willing creature";
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Forge Coven's Bond",
      activationType: "bonus",
      activationCondition: `Bond with ${this.bondTarget} you can see within 60 feet`,
      addItemConsume: true,
      targetType: "creature",
      targetCount: 1,
      overrideTarget: true,
      overrideRange: true,
      noTemplate: true,
      data: {
        range: { value: "60", units: "ft", special: "" },
        duration: { value: "1", units: "hour", override: true },
      },
    };
  }

  get bondActivity(): IDDBActivityData {
    const uses: I5eSystemLimitedUses = {
      override: true,
      spent: null,
      max: "max(1, @abilities.cha.mod)",
      recovery: [{ period: "lr", type: "recoverAll", formula: undefined }],
    } as I5eSystemLimitedUses;
    const base: IDDBActivityData = {
      noConsumeTargets: true,
      addActivityConsume: true,
      data: { uses },
    };
    switch (this.bondKind) {
      case "damage":
        return {
          ...base,
          name: "Bond: Halve Damage",
          activationType: "reaction",
          activationCondition: "You take damage while bound: halve it (round down), the bound creature takes the same amount",
          targetType: "self",
        };
      case "save":
        return {
          ...base,
          name: "Bond: Share Saving Throw",
          activationType: "reaction",
          activationCondition: "You or the bound creature fail a saving throw: the other makes the same save and its result is used instead",
          targetType: "creature",
          targetCount: 1,
          overrideTarget: true,
        };
      default:
        return {
          ...base,
          name: "Bond: Teleport",
          activationType: "bonus",
          activationCondition: "Teleport up to 60 feet to within 5 feet of the bound creature, bring it to you, or swap places",
          targetType: "self",
          overrideRange: true,
          overrideTarget: true,
          noTemplate: true,
          data: {
            ...base.data,
            range: { value: "60", units: "ft", special: "" },
          },
        };
    }
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: this.bondActivity.name!,
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          generateUses: true,
          generateConsumption: true,
        },
        overrides: this.bondActivity,
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Coven's Bond",
        activityMatch: "Forge Coven's Bond",
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      uses: this._getUsesWithSpent({
        type: "class",
        name: "Forge Coven's Bond",
        max: "1",
        period: "lr",
      }),
    };
  }

}
