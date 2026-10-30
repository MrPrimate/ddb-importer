import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Soul Effigy: a Constitution save binds the target to the doll; for 8 hours a Magic action can
 * control, harm or restrain it. Harm's 2d8 damage, of a type suiting how the effigy is hurt,
 * ignores Resistance and Immunity; Restrain gives the Restrained condition until the end of your
 * next turn. Control is left to the table.
 */
export default class SoulEffigy extends DDBEnricherData {

  static HARM = "Harm";
  static RESTRAIN = "Restrain";

  static effigyAction(name: string, type: IDDBActivityType, condition: string, extra: Partial<IDDBActivityBuild> = {}): IDDBAdditionalActivity {
    return {
      init: { name, type },
      build: {
        generateDuration: true,
        durationOverride: { units: "inst", concentration: false },
        generateActivation: true,
        generateConsumption: false,
        generateTarget: true,
        noSpellslot: true,
        activationOverride: { type: "action", value: 1, condition },
        targetOverride: {
          override: true,
          affects: { count: "1", type: "creature" },
          template: {},
        },
        ...extra,
      },
      overrides: {
        noeffect: type !== DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        data: { range: { override: true, units: "any" } },
      },
    };
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Bind Soul",
      noeffect: true,
      data: {
        damage: { parts: [] },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      SoulEffigy.effigyAction("Control", DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        "The target only takes the Dash, Disengage, Hide, or Utilize action on its next turn"),
      SoulEffigy.effigyAction(SoulEffigy.HARM, DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        "Prod the effigy; choose a damage type suiting how you harm it", {
          generateDamage: true,
          damageParts: [
            DDBEnricherData.basicDamagePart({ number: 2, denomination: 8, types: ["bludgeoning", "piercing", "slashing"] }),
          ],
        }),
      SoulEffigy.effigyAction(SoulEffigy.RESTRAIN, DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        "Submerge the effigy in water"),
    ];
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Soul Effigy: Restrained",
        activityMatch: SoulEffigy.RESTRAIN,
        statuses: ["Restrained"],
        options: { expiry: "sourceEnd" },
      },
      // Harm's damage ignores Resistance and Immunity, whatever type it deals
      ...DDBEnricherData.ignoreDamageReductionEffect("Soul Effigy: Harm", "ALL", {
        conditions: this.selfActivityFilter(SoulEffigy.HARM),
      }),
    ];
  }

}
