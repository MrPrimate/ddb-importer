import DDBEnricherData from "../data/DDBEnricherData";

/**
 * AU 2024. DDB lists the resistances and immunities as spell modifiers, which the spell parser
 * does not turn into an effect, so the applied effect is built here.
 */
export default class IronBody extends DDBEnricherData {

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Iron Body",
        changes: [
          DDBEnricherData.ChangeHelper.damageResistanceChange("bludgeoning"),
          DDBEnricherData.ChangeHelper.damageResistanceChange("fire"),
          DDBEnricherData.ChangeHelper.damageResistanceChange("piercing"),
          DDBEnricherData.ChangeHelper.damageResistanceChange("slashing"),
          DDBEnricherData.ChangeHelper.damageImmunityChange("poison"),
          DDBEnricherData.ChangeHelper.conditionImmunityChange("paralyzed"),
          DDBEnricherData.ChangeHelper.conditionImmunityChange("petrified"),
          DDBEnricherData.ChangeHelper.conditionImmunityChange("poisoned"),
        ],
        options: {
          description: "Living metal: the target's Exhaustion level can't increase, and any Paralyzed, Petrified or Poisoned condition ends when the spell is cast.",
        },
      },
    ];
  }

}
