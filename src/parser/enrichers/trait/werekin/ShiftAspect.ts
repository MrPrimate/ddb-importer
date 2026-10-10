import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Werekin: a bonus action transformation for a minute, once per long rest, choosing an aspect each
 * time. Bestial Strength grants temporary hit points; Primal Savagery's roar frightens non-allies
 * within 10 feet (Charisma save, DC 8 + Charisma + proficiency) and can repeat as a bonus action.
 */
export default class ShiftAspect extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Transform",
      targetType: "self",
      activationType: "bonus",
      addItemConsume: true,
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: { name: "Bestial Strength", type: DDBEnricherData.ACTIVITY_TYPES.HEAL },
        build: {
          generateConsumption: false,
          generateTarget: true,
          generateActivation: true,
          generateHealing: true,
          activationOverride: { type: "special", value: 1, condition: "You transform choosing Bestial Strength" },
          healingPart: DDBEnricherData.basicDamagePart({ customFormula: "2 * @prof", types: ["temphp"] }),
        },
        overrides: { targetSelf: true, noConsumeTargets: true },
      },
      {
        init: { name: "Primal Savagery: Roar", type: DDBEnricherData.ACTIVITY_TYPES.SAVE },
        build: {
          generateConsumption: false,
          generateTarget: true,
          generateActivation: true,
          generateSave: true,
          generateRange: true,
          activationOverride: { type: "bonus", value: 1, condition: "When you choose Primal Savagery, and as a bonus action each turn while it lasts" },
          saveOverride: { ability: ["cha"], dc: { calculation: "", formula: "8 + @abilities.cha.mod + @prof" } },
        },
        overrides: {
          rangeSelf: true,
          noConsumeTargets: true,
          data: {
            target: {
              override: true,
              affects: { type: "enemy" },
              template: { contiguous: false, type: "radius", size: "10", units: "ft" },
            },
          },
        },
      },
    ];
  }

  // the parser's own Frightened status duplicates the roar's effect below
  override get clearAutoEffects(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Bestial Strength",
        activityMatch: "Bestial Strength",
        options: { durationSeconds: 60, description: "Advantage on Strength checks and on checks and saves to resist or end the Grappled condition." },
        changes: [DDBEnricherData.ChangeHelper.abilityCheckRollModeChange("str", DDBEnricherData.ChangeHelper.ADVANTAGE)],
      },
      {
        name: "Swift Hunter",
        activityMatch: "Transform",
        options: { durationSeconds: 60, description: "Speed +10 feet; Advantage on Strength (Athletics) and Wisdom (Survival) checks." },
        changes: [
          DDBEnricherData.ChangeHelper.movementBonusChange("10"),
          DDBEnricherData.ChangeHelper.skillRollModeChange("ath", DDBEnricherData.ChangeHelper.ADVANTAGE),
          DDBEnricherData.ChangeHelper.skillRollModeChange("sur", DDBEnricherData.ChangeHelper.ADVANTAGE),
        ],
      },
      {
        name: "Frightened",
        activityMatch: "Primal Savagery: Roar",
        statuses: ["frightened"],
        options: { durationSeconds: 12, description: "Frightened until the end of the werekin's next turn. A creature that succeeds is immune to the roar for 24 hours." },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      uses: this._getUsesWithSpent({ type: "race", name: "Shift Aspect", max: "1", period: "lr" }),
    };
  }

}
