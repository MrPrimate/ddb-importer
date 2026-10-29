import DDBEnricherData from "../../data/DDBEnricherData";

export default class EnvenomWeapons extends DDBEnricherData {

  // the 2d6 Poison rides on this feature's own activity, so the rule is scoped to rolls made with it
  override get effects(): IDDBEffectHint[] {
    return DDBEnricherData.damageRuleEffect(
      "Envenom Weapons: Ignore Poison Resistance",
      DDBEnricherData.ChangeHelper.ignoreResistanceChanges("poison", {
        conditions: this.selfIdentifierFilter,
      }),
    );
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }


  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      { action: { name: "Sneak Attack: Poison (Envenom)", type: "class" } },
    ];
  }

}
