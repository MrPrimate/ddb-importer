import DDBEnricherData from "../data/DDBEnricherData";

export default class AuraOfLife extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  override get activity(): IDDBActivityData {
    // dnd5e PR #7332 ships an "Aura of Life" spell effect (SRDEffects.spell("auraOfLife")); the stock
    // resistance covers the automatable part until that pack content is released
    return {
      name: "Cast",
      data: {
        behaviors: [
          DDBEnricherData.BehaviorHelper.applyEffect({
            effects: DDBEnricherData.SRDEffects.damageResistance("necrotic"),
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
