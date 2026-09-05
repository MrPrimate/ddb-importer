import DDBEnricherData from "../data/DDBEnricherData";

export default class AuraOfLife extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  override get activity(): IDDBActivityData {
    // the official effect covers the automatable part (necrotic resistance); the max-HP floor and
    // the 1 HP regain for downed allies stay on the description
    return {
      name: "Cast",
      data: {
        behaviors: [
          DDBEnricherData.BehaviorHelper.applyEffect({
            effects: DDBEnricherData.SRDEffects.spell("auraOfLife"),
          }),
        ],
      },
    };
  }

  override get override(): IDDBOverrideData {
    return {
      data: {
        system: {
          target: {
            affects: {
              type: "ally",
            },
          },
        },
      },
    };
  }

}
