import DDBEnricherData from "../data/DDBEnricherData";

const AURA_NAME = "Aura of Haunted Power";

const AURA_DESCRIPTION = "Resistance to Cold, Necrotic and Psychic damage and Advantage on saves against the Frightened condition. Undead have Disadvantage on attack rolls against creatures in the aura.";

function auraChanges(): IActiveEffectChangeData[] {
  return [
    DDBEnricherData.ChangeHelper.damageResistanceChange("cold"),
    DDBEnricherData.ChangeHelper.damageResistanceChange("necrotic"),
    DDBEnricherData.ChangeHelper.damageResistanceChange("psychic"),
  ];
}

// AC5e only sees the condition a save is against on the initial save of the activity applying it
function auraAc5eChanges(): IActiveEffectChangeData[] {
  return [
    DDBEnricherData.ChangeHelper.ac5eChange("riderStatuses.frightened", 20, "flags.automated-conditions-5e.save.advantage"),
  ];
}

/**
 * AUD. DDB's resistance modifiers are restricted to the aura, so the automatic transfer effect is
 * replaced by the always-on Necrotic resistance plus the aura in its two arms: with Active Auras
 * or Aura Effects the wielder carries a 30-foot aura, otherwise the activity targets the allies
 * inside a 30-foot emanation and the effect is applied to each of them.
 */
export default class StaffOfTheSpiritAegis extends DDBEnricherData {

  get hasAuraModule(): boolean {
    const modules = DDBEnricherData.AutoEffects.effectModules();
    return modules.activeAurasInstalled || modules.auraeffectsInstalled;
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    const target: I5eActivityTarget = this.hasAuraModule
      ? { override: true, affects: { type: "self" }, template: {} }
      : {
        override: true,
        affects: { type: "ally", choice: true },
        template: { type: "radius", size: "30", units: "ft" },
      };
    return [
      {
        init: { name: AURA_NAME, type: DDBEnricherData.ACTIVITY_TYPES.UTILITY },
        build: { generateActivation: true, generateConsumption: false, generateTarget: true },
        overrides: {
          targetType: this.hasAuraModule ? "self" : "ally",
          activationType: "action",
          data: { target },
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Staff of the Spirit Aegis: Necrotic Resistance",
        options: { transfer: true },
        changes: [DDBEnricherData.ChangeHelper.damageResistanceChange("necrotic")],
      },
      {
        name: AURA_NAME,
        activityMatch: AURA_NAME,
        aurasNever: true,
        changes: auraChanges(),
        ac5eChanges: auraAc5eChanges(),
        options: { transfer: false, description: AURA_DESCRIPTION },
      },
      {
        name: AURA_NAME,
        activityMatch: AURA_NAME,
        aurasOnly: true,
        daeStackable: "none",
        options: { transfer: false, description: AURA_DESCRIPTION },
        data: {
          flags: {
            ActiveAuras: {
              aura: "Allies",
              radius: "30",
              isAura: true,
              ignoreSelf: false,
              inactive: false,
              hidden: false,
              displayTemp: true,
            },
          },
        },
        auraeffects: {
          applyToSelf: true,
          bestFormula: "",
          canStack: false,
          collisionTypes: ["move"],
          combatOnly: false,
          disableOnHidden: true,
          distanceFormula: "30",
          disposition: 1,
          evaluatePreApply: true,
          overrideName: "",
          script: "",
        },
        changes: auraChanges(),
        ac5eChanges: auraAc5eChanges(),
      },
    ];
  }

}
