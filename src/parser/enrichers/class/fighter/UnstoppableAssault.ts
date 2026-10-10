import DDBEnricherData from "../../data/DDBEnricherData";

/** Unstoppable Assault: creatures struck by the extra critical attacks save (Strength, DC 8 + proficiency + Strength) or are pushed 10 feet. */
export default class UnstoppableAssault extends DDBEnricherData {

  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get addToDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (this.isAction) return [];
    return [
      {
        init: { name: "Push", type: DDBEnricherData.ACTIVITY_TYPES.SAVE },
        build: {
          generateConsumption: false,
          generateTarget: true,
          generateActivation: true,
          generateSave: true,
          activationOverride: { type: "special", value: 1, condition: "A creature is struck by one of the extra attacks (pushed 10 feet on a failure)" },
          saveOverride: { ability: ["str"], dc: { calculation: "", formula: "8 + @prof + @abilities.str.mod" } },
        },
        overrides: { targetType: "creature", noConsumeTargets: true, noTemplate: true },
      },
    ];
  }

}
