import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Hat of Wizardry: the DC 10 Intelligence (Arcana) check to cast a wizard cantrip you do not know, once per long rest.
 */
export default class HatOfWizardry extends DDBEnricherData {
  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.CHECK;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Attempt to Cast Spell",
      targetType: "self",
      rangeSelf: true,
      addItemConsume: true,
      data: { check: { ability: "", associated: ["arc"], dc: { calculation: "", formula: "10" } } },
    };
  }

}
