import DDBEnricherData from "../../data/DDBEnricherData";
import _ArcaneShot2024Option from "./_ArcaneShot2024Option";

/**
 * AU 2024. DDB shipped the Piercing Shot action under the name "Beguiling Shot" as well (bug
 * reported 2026-09-03); while no "Piercing Shot" action exists the action match would hand this
 * option both activities, so they are built here instead. Once DDB corrects the name the normal
 * action path applies and only the Charmed rider is added.
 */
export default class BeguilingShot extends _ArcaneShot2024Option {

  protected override get diceCount(): number {
    return 2;
  }

  protected override get damageType(): string {
    return "psychic";
  }

  /** true while the capture still carries the mis-named duplicate action */
  get ddbActionBug(): boolean {
    return !this.hasDdbClassAction("Piercing Shot");
  }

  override get type(): IDDBActivityType | null {
    if (!this.ddbActionBug) return super.type;
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get useDefaultAdditionalActivities(): boolean {
    return this.ddbActionBug ? false : super.useDefaultAdditionalActivities;
  }

  override get addAutoAdditionalActivities(): boolean {
    return this.ddbActionBug ? false : super.addAutoAdditionalActivities;
  }

  override get activity(): IDDBActivityData | null {
    if (!this.ddbActionBug) return super.activity;
    return {
      name: "Extra Damage",
      noTemplate: true,
      targetType: "creature",
      activationType: "special",
      data: {
        damage: {
          critical: { allow: true },
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: this.scaleFormula,
              types: [this.damageType],
            }),
          ],
        },
        range: { value: null, units: "spec" },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (!this.ddbActionBug || this.isAction) return [];
    return [
      {
        init: {
          name: "Save vs Charmed",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateSave: true,
          generateDamage: false,
          generateRange: true,
          saveOverride: { ability: ["wis"], dc: { calculation: "int", formula: "" } },
        },
        overrides: {
          noConsumeTargets: true,
          activationType: "special",
          noTemplate: true,
          targetType: "creature",
          data: { range: { value: null, units: "spec" } },
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    if (this.isAction) return [];
    return [
      {
        name: "Beguiled",
        activityMatch: this.ddbActionBug ? "Save vs Charmed" : this.name,
        statuses: ["Charmed"],
        options: { expiry: "sourceStart" },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return this.ddbActionBug ? { ignoredConsumptionActivities: ["Save vs Charmed"] } : {};
  }

}
