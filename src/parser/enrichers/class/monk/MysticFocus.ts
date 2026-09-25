import DDBEnricherData from "../../data/DDBEnricherData";

const CONVERT_LEVELS = [1, 2, 3, 4];
const RECOVER: { level: number; cost: number; monkLevel: number }[] = [
  { level: 1, cost: 2, monkLevel: 6 },
  { level: 2, cost: 3, monkLevel: 7 },
  { level: 3, cost: 5, monkLevel: 13 },
  { level: 4, cost: 6, monkLevel: 19 },
];

/**
 * Warrior of the Mystic Arts (AU 2024): spell slots and Focus Points convert both ways. The
 * Monk's Focus pool is the consumption target; slot recovery is the negative spell-slot
 * consumption the system supports. Nothing here reads the DDB action, whose name shipped as
 * "Covert Spell Slots" (bug reported 2026-09-03), so the correction to "Convert" needs no change.
 */
export default class MysticFocus extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  override get useDefaultAdditionalActivities(): boolean {
    return false;
  }

  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    const converts: IDDBAdditionalActivity[] = CONVERT_LEVELS.map((level) => ({
      init: {
        name: `Convert Level ${level} Slot to Focus Points`,
        type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
      },
      build: {
        generateConsumption: true,
        generateTarget: true,
        generateActivation: true,
        activationOverride: { type: "none", value: null, condition: "" },
      },
      overrides: {
        targetType: "self",
        addItemConsume: true,
        itemConsumeTargetName: "Monk's Focus",
        itemConsumeValue: `-${level}`,
        additionalConsumptionTargets: [
          { type: "spellSlots", value: "1", target: `${level}`, scaling: { mode: "", formula: "" } },
        ],
      },
    }));
    const recovers: IDDBAdditionalActivity[] = RECOVER.map(({ level, cost, monkLevel }) => ({
      init: {
        name: `Recover Level ${level} Slot`,
        type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
      },
      build: {
        generateConsumption: true,
        generateTarget: true,
        generateActivation: true,
        activationOverride: { type: "special", value: null, condition: `Short Rest or Uncanny Metabolism; Monk level ${monkLevel}+` },
      },
      overrides: {
        targetType: "self",
        addItemConsume: true,
        itemConsumeTargetName: "Monk's Focus",
        itemConsumeValue: `${cost}`,
        additionalConsumptionTargets: [
          { type: "spellSlots", value: "-1", target: `${level}`, scaling: { mode: "", formula: "" } },
        ],
      },
    }));
    return [...converts, ...recovers];
  }

}
