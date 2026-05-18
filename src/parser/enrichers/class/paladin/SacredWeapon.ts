import DDBEnricherData from "../../data/DDBEnricherData";

export default class SacredWeapon extends DDBEnricherData {

  get activity(): IDDBActivityData {
    return {
      type: DDBEnricherData.ACTIVITY_TYPES.ENCHANT,
      activationType: "special",
      noTemplate: true,
      targetType: "self",
      data: {
        restrictions: {
          type: "weapon",
          allowMagical: true,
        },
      },
    };
  }

  get override(): IDDBOverrideData {
    return {
      ignoredConsumptionActivities: ["Sacred Weapon Light Toggle"],
    };
  }

  get effects(): IDDBEffectHint[] {
    const lightChanges = [
      DDBEnricherData.ChangeHelper.upgradeChange((this.is2014 ? "5" : "40"), 20, "token.light.dim"),
      DDBEnricherData.ChangeHelper.upgradeChange((this.is2014 ? "0" : "20"), 20, "token.light.bright"),
      DDBEnricherData.ChangeHelper.overrideChange("#ffffff", 20, "token.light.color"),
      DDBEnricherData.ChangeHelper.overrideChange("0.25", 20, "token.light.alpha"),
      DDBEnricherData.ChangeHelper.overrideChange("4", 20, "token.light.animation.intensity"),
      DDBEnricherData.ChangeHelper.overrideChange("sunburst", 20, "token.light.animation.type"),
      DDBEnricherData.ChangeHelper.overrideChange("2", 20, "token.light.animation.speed"),
    ];

    if (this.is2014) {
      return [
        {
          type: "enchant",
          name: "Sacred Weapon",
          magicalBonus: {
            makeMagical: true,
          },
          changes: [
            DDBEnricherData.ChangeHelper.addChange("(max(1,@abilities.cha.mod))", 20, "activities[attack].attack.bonus"),
          ].concat(lightChanges),
          options: {
            name: "Sacred Weapon",
            description: `The weapon shines with Sacred Energy.`,
            durationSeconds: 60,
          },
        },
      ];
    } else {
      return [
        {
          type: "enchant",
          name: "Sacred Weapon",
          magicalBonus: {
            makeMagical: true,
          },
          changes: [
            DDBEnricherData.ChangeHelper.addChange("(max(1,@abilities.cha.mod))", 20, "activities[attack].attack.bonus"),
            DDBEnricherData.ChangeHelper.unsignedAddChange("radiant", 20, "system.damage.base.types"),
          ].concat(lightChanges),
          options: {
            name: "Sacred Weapon",
            description: `The weapon shines with Sacred Energy.`,
            durationSeconds: 600,
          },
        },
      ];
    }
  }
}
