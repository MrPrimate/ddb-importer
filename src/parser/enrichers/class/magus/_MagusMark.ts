import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * The level 3 Magus subclass marks (Amethyst, Alabaster, Obsidian, Jade, Selenite, Emerald) add a
 * rider to each Mystic Mark benefit: an Aegis Reaction and an Enspell on-hit effect. DDB's two
 * actions build them with the wrong activation and saves, so each mark lists its own activities;
 * the first one becomes the primary activity.
 */
export default abstract class MagusMark extends DDBEnricherData {

  /** The mark's activities as init/overrides (plus optional build flags); the first is the primary. */
  abstract get markActivities(): IDDBAdditionalActivity[];

  static markActivity(name: string, type: IDDBActivityType, overrides: IDDBActivityData, build: IDDBActivityBuild = {}): IDDBAdditionalActivity {
    return { init: { name, type }, build, overrides };
  }

  static aegis(overrides: IDDBActivityData = {}): IDDBActivityData {
    return {
      activationType: "reaction",
      targetType: "creature",
      targetCount: 1,
      rangeValue: 30,
      rangeType: "ft",
      noConsumeTargets: true,
      ...overrides,
    };
  }

  static enspell(overrides: IDDBActivityData = {}): IDDBActivityData {
    return {
      activationType: "special",
      activationCondition: "Once per turn when you hit a creature with a weapon or Unarmed Strike while your Mystic Mark has Enspell",
      targetType: "creature",
      targetCount: 1,
      noConsumeTargets: true,
      noTemplate: true,
      ...overrides,
    };
  }

  override get type(): IDDBActivityType | null {
    return this.markActivities[0].init?.type ?? null;
  }

  override get activity(): IDDBActivityData {
    const first = this.markActivities[0];
    return {
      name: first.init?.name,
      ...first.overrides,
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return this.markActivities.slice(1).map((activity) => ({
      ...activity,
      build: {
        generateActivation: true,
        generateTarget: true,
        generateRange: true,
        ...(activity.build ?? {}),
      },
    }));
  }

}
