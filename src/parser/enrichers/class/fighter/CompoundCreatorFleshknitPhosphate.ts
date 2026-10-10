import DDBEnricherData from "../../data/DDBEnricherData";

/** Living Crucible compound: for a minute, regain Hit Points equal to your Proficiency Bonus at the start of each turn. */
export default class CompoundCreatorFleshknitPhosphate extends DDBEnricherData {

  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get addToDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Regain Hit Points",
          type: DDBEnricherData.ACTIVITY_TYPES.HEAL,
        },
        build: {
          generateConsumption: false,
          generateTarget: true,
          generateActivation: true,
          generateHealing: true,
          activationOverride: {
            type: "turnStart",
            value: 1,
            condition: "While Fleshknit Phosphate lasts, if you have at least 1 Hit Point",
          },
          healingPart: DDBEnricherData.basicDamagePart({ customFormula: "@prof", types: ["healing"] }),
        },
        overrides: {
          targetSelf: true,
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Fleshknit Phosphate",
        activityMatch: "Consume Compound",
        options: {
          durationSeconds: 60,
          description: "Regain Hit Points equal to your Proficiency Bonus at the start of each of your turns if you have at least 1 Hit Point.",
        },
      },
    ];
  }

}
