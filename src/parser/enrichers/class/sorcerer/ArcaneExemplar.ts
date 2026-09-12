import DDBEnricherData from "../../data/DDBEnricherData";

export default class ArcaneExemplar extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Arcane Exemplar Form",
      targetType: "self",
      activationType: "bonus",
      activationCondition: "Expend a charged Essence Rune",
      addItemConsume: true,
      itemConsumeTargetName: "Essence Runes",
    };
  }

  // "Your exemplar form lasts until the end of your turn. However, you can expend a charged rune
  // at the end of your turn (no action required) to extend the duration until the end of your
  // next turn" - the extension costs a second rune, so it is a second activity
  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        duplicate: true,
        overrides: {
          activationType: "special",
          activationCondition: "At the end of your turn while in your exemplar form; expend a charged Essence Rune",
          addItemConsume: true,
          itemConsumeTargetName: "Essence Runes",
          data: { name: "Extend Exemplar Form" },
        },
      },
      {
        init: {
          name: "Regain Hit Points",
          type: DDBEnricherData.ACTIVITY_TYPES.HEAL,
        },
        build: {
          generateConsumption: false,
        },
        overrides: {
          activationType: "special",
          activationCondition: "When you cast a spell of 1st level or higher while in your exemplar form",
          targetType: "self",
          rangeSelf: true,
          noConsumeTargets: true,
          noSpellslot: true,
          noeffect: true,
          addConsumptionScalingMax: "9",
          data: {
            healing: DDBEnricherData.basicDamagePart({
              bonus: "1",
              types: ["healing"],
              scalingMode: "whole",
              scalingFormula: "1",
            }),
          },
        },
      },
    ];
  }

  get formDescription(): string {
    return "Flying speed 60 ft; resistance to damage dealt by spells; creatures have disadvantage on saving throws against your sorcerer spells; you regain hit points equal to the spell's level when you cast a spell of 1st level or higher. When the form ends you are stunned until the end of your next turn.";
  }

  get formChanges(): IActiveEffectChangeData[] {
    return [
      DDBEnricherData.ChangeHelper.upgradeChange("60", 20, "system.attributes.movement.speeds.fly"),
      DDBEnricherData.ChangeHelper.unsignedAddChange("Damage dealt by spells", 20, "system.traits.dr.custom"),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Arcane Exemplar Form",
        activityMatch: "Arcane Exemplar Form",
        options: {
          // "lasts until the end of your turn"
          expiry: "turnEnd",
          description: this.formDescription,
        },
        changes: this.formChanges,
      },
      {
        name: "Arcane Exemplar Form (Extended)",
        activityMatch: "Extend Exemplar Form",
        options: {
          // "extend the duration until the end of your next turn", spent at the end of the current one
          expiry: "sourceEnd",
          description: this.formDescription,
        },
        changes: this.formChanges,
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      uses: this._getUsesWithSpent({
        type: "class",
        name: "Arcane Exemplar",
        includesName: true,
        max: "1",
        period: "lr",
      }),
    };
  }

}
