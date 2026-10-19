import DDBEnricherData from "../../data/DDBEnricherData";

export default class Survivor extends DDBEnricherData {
  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  get activity(): IDDBActivityData {
    return {
      name: "Heroic Rally",
      targetType: "self",
      activationType: "turnStart",
      activationCondition: this.is2014
        ? "You have no more than half of your hit points left"
        : "You are Bloodied and have at least 1 Hit Point",
      data: {
        healing: DDBEnricherData.basicDamagePart({
          customFormula: "5 + @abilities.con.mod",
          types: ["healing"],
        }),
      },
    };
  }

  // dnd5e has no death save critical threshold, so the 18-20 rule stays in the description
  override get effects(): IDDBEffectHint[] {
    if (this.is2014) return [];
    return [
      {
        name: "Defy Death",
        options: {
          transfer: true,
          description: "Advantage on Death Saving Throws; a roll of 18-20 counts as a 20.",
        },
        changes: [DDBEnricherData.ChangeHelper.advantageDeathSaveChange()],
      },
    ];
  }

}
