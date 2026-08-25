import DDBEnricherData from "../data/DDBEnricherData";

export default class Silence extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    // dnd5e PR #7332 ships a single "Silenced" spell effect (SRDEffects.spell("silenced")); until
    // that pack content is released the same result comes from three stock effects
    return {
      name: "Cast",
      data: {
        behaviors: [
          DDBEnricherData.BehaviorHelper.applyEffect({
            effects: [
              DDBEnricherData.SRDEffects.condition("silenced"),
              DDBEnricherData.SRDEffects.condition("deafened"),
              DDBEnricherData.SRDEffects.damageImmunity("thunder"),
            ],
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
