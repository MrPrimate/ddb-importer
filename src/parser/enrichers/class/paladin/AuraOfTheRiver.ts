import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * The paladin's Aura of Protection becomes difficult terrain for other creatures. The paladin
 * names who is spared, which a region cannot ask, so it hinders enemies; terrain is ignored by
 * disposition and the paladin's own token is friendly to itself. The push on a hit is DDB's own
 * action and is kept beside this.
 */
export default class AuraOfTheRiver extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Place Aura",
      targetType: "enemy",
      activationType: "special",
      noConsumeTargets: true,
      data: {
        target: {
          override: true,
          affects: { type: "enemy" },
          template: { contiguous: false, type: "radius", size: "@scale.paladin.aura-of-protection", units: "ft" },
        },
        range: { override: true, value: null, units: "self", special: "" },
        behaviors: [
          DDBEnricherData.BehaviorHelper.difficultTerrain({ types: ["liquid"] }),
        ],
      },
    };
  }

  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

}
