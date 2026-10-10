import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * School of Biomancy: crack a crafted Brutish or Swift capsule as a bonus action for a minute of
 * stimulants. The capsule is the feature's single use; crafting another (an hour, possibly during a
 * rest) restores it, so the craft activity carries a negative use cost.
 */
export default class EndocrineOverload extends DDBEnricherData {

  /** The archetype an option document names; the parent document (no choice yet) offers both. */
  get archetype(): "brutish" | "swift" | null {
    const names = [this.ddbParser.originalName ?? "", ...(this.ddbParser._chosen ?? []).map((choice) => choice.label ?? "")];
    if (names.some((name) => (/brutish/i).test(name))) return "brutish";
    if (names.some((name) => (/swift/i).test(name))) return "swift";
    return null;
  }

  get hasBrutish(): boolean {
    return this.archetype !== "swift";
  }

  get hasSwift(): boolean {
    return this.archetype !== "brutish";
  }

  static RELAPSE = "When the minute ends you gain one level of Exhaustion and can't move or take actions until the end of your next turn.";

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: this.hasBrutish ? "Activate Capsule: Brutish" : "Activate Capsule: Swift",
      targetType: "self",
      activationType: "bonus",
      addItemConsume: true,
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    const brutishOnly = ["Brutish Appendage", "Brutish Vigour"];
    const activities: IDDBAdditionalActivity[] = [
      {
        init: { name: "Activate Capsule: Swift", type: DDBEnricherData.ACTIVITY_TYPES.UTILITY },
        build: { generateConsumption: true, generateTarget: true, generateActivation: true, activationOverride: { type: "bonus", value: 1, condition: "" } },
        overrides: { targetSelf: true, addItemConsume: true },
      },
      {
        init: { name: "Brutish Appendage", type: DDBEnricherData.ACTIVITY_TYPES.ATTACK },
        build: {
          generateConsumption: false,
          generateTarget: true,
          generateActivation: true,
          generateAttack: true,
          generateDamage: true,
          activationOverride: { type: "action", value: 1, condition: "While a Brutish capsule is active" },
          damageParts: [DDBEnricherData.basicDamagePart({ number: 2, denomination: 10, bonus: "@abilities.str.mod", types: ["bludgeoning", "piercing", "slashing"] })],
        },
        overrides: {
          targetType: "creature",
          noConsumeTargets: true,
          data: {
            attack: { ability: "str", type: { value: "melee", classification: "weapon" } },
            range: { units: "ft", value: "5" },
          },
        },
      },
      {
        init: { name: "Brutish Vigour", type: DDBEnricherData.ACTIVITY_TYPES.HEAL },
        build: {
          generateConsumption: false,
          generateTarget: true,
          generateActivation: true,
          generateHealing: true,
          activationOverride: { type: "turnStart", value: 1, condition: "Start of each of your turns while a Brutish capsule is active" },
          healingPart: DDBEnricherData.basicDamagePart({ customFormula: "max(2, 2 * @abilities.int.mod)", types: ["temphp"] }),
        },
        overrides: { targetSelf: true, noConsumeTargets: true },
      },
      {
        init: { name: "Craft Capsule", type: DDBEnricherData.ACTIVITY_TYPES.UTILITY },
        build: { generateConsumption: true, generateTarget: true, generateActivation: true, activationOverride: { type: "hour", value: 1, condition: "Can be done during a rest" } },
        overrides: { targetSelf: true, addItemConsume: true, itemConsumeValue: "-1" },
      },
    ];
    return activities.filter((activity) => {
      const name = activity.init?.name ?? "";
      if (name === "Activate Capsule: Swift") return this.hasBrutish && this.hasSwift;
      if (brutishOnly.includes(name)) return this.hasBrutish;
      return true;
    });
  }

  override get effects(): IDDBEffectHint[] {
    const effects: IDDBEffectHint[] = [
      {
        name: "Endocrine Overload: Brutish",
        activityMatch: "Activate Capsule: Brutish",
        options: {
          durationSeconds: 60,
          description: `You become Large if smaller, your Strength rises to your Intelligence, you have Advantage on Strength and Constitution checks and saves, you can attack twice with the Attack action, and you gain temporary hit points at the start of each turn. ${EndocrineOverload.RELAPSE}`,
        },
        changes: [
          DDBEnricherData.ChangeHelper.overrideChange("lg", 20, "system.traits.size"),
          DDBEnricherData.ChangeHelper.upgradeChange("@abilities.int.value", 20, "system.abilities.str.value"),
          DDBEnricherData.ChangeHelper.abilityCheckRollModeChange("str", DDBEnricherData.ChangeHelper.ADVANTAGE),
          DDBEnricherData.ChangeHelper.abilityCheckRollModeChange("con", DDBEnricherData.ChangeHelper.ADVANTAGE),
          DDBEnricherData.ChangeHelper.abilitySaveRollModeChange("str", DDBEnricherData.ChangeHelper.ADVANTAGE),
          DDBEnricherData.ChangeHelper.abilitySaveRollModeChange("con", DDBEnricherData.ChangeHelper.ADVANTAGE),
        ],
      },
      {
        name: "Endocrine Overload: Swift",
        activityMatch: "Activate Capsule: Swift",
        options: {
          durationSeconds: 60,
          description: `Your Dexterity rises to your Intelligence, you have Advantage on Dexterity checks and saves, your 1-action cantrips can be cast as a bonus action, and you gain the benefits of haste (doubled speed, +2 AC, an extra limited action) which can't be dispelled. ${EndocrineOverload.RELAPSE}`,
        },
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("@abilities.int.value", 20, "system.abilities.dex.value"),
          DDBEnricherData.ChangeHelper.abilityCheckRollModeChange("dex", DDBEnricherData.ChangeHelper.ADVANTAGE),
          DDBEnricherData.ChangeHelper.abilitySaveRollModeChange("dex", DDBEnricherData.ChangeHelper.ADVANTAGE),
          DDBEnricherData.ChangeHelper.signedAddChange("2", 20, "system.attributes.ac.bonus"),
          DDBEnricherData.ChangeHelper.customChange("*2", 30, "system.attributes.movement.all"),
        ],
      },
    ];
    return effects.filter((effect) => ((effect.name ?? "").endsWith("Brutish") ? this.hasBrutish : this.hasSwift));
  }

  override get override(): IDDBOverrideData {
    return {
      uses: this._getUsesWithSpent({
        type: "class",
        name: "Endocrine Overload: Activate Capsule",
        max: "1",
      }),
    };
  }

}
