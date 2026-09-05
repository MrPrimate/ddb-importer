import DDBEnricherData from "../data/DDBEnricherData";

export default class Silence extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    // the official Silenced effect carries the silenced + deafened statuses and thunder immunity
    return {
      name: "Cast",
      data: {
        behaviors: [
          DDBEnricherData.BehaviorHelper.applyEffect({
            effects: DDBEnricherData.SRDEffects.spell("silenced"),
          }),
        ],
      },
    };
  }

  override get override(): IDDBOverrideData {
    return {
      data: {
        flags: {
          limits: {
            sight: {
              hearing: { enabled: true, range: 0 },
            },
            sound: { enabled: true, range: 0 },
          },
          walledtemplates: {
            wallRestriction: "move",
            wallsBlock: "walled",
          },
        },
      },
    };
  }

}
