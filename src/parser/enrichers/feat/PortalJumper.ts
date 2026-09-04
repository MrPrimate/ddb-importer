import DDBEnricherData from "../data/DDBEnricherData";

const RESISTANCES = ["Necrotic", "Psychic", "Radiant"];

export default class PortalJumper extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.TELEPORT;
  }

  override get useDefaultAdditionalActivities(): boolean {
    return false;
  }

  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Portal Step",
      activationType: "special",
      activationCondition: "Costs 15 feet of movement, once per turn",
      overrideActivation: true,
      addItemConsume: true,
      data: {
        range: { override: true, value: "15", units: "ft", special: "" },
        target: {
          override: true,
          prompt: false,
          affects: { count: "1", type: "self" },
          template: {},
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    const chosen = this.ddbParser.isMuncher
      ? ""
      : (this.ddbParser._chosen?.map((a) => a.label).join("|") ?? "");
    return RESISTANCES.map((type) => ({
      name: `Otherworldly Resilience: ${type}`,
      options: { transfer: true, disabled: !chosen.includes(type) },
      changes: [DDBEnricherData.ChangeHelper.damageResistanceChange(type)],
    }));
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get override(): IDDBOverrideData {
    return {
      uses: this._getUsesWithSpent({
        type: "feat",
        name: "Portal Step",
        max: "@prof",
        period: "lr",
      }),
    };
  }

}
