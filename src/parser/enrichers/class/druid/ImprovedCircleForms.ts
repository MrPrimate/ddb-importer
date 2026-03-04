import DDBEnricherData from "../../data/DDBEnricherData";

export default class ImprovedCircleForms extends DDBEnricherData {

  get effects(): IDDBEffectHint[] {
    return [
      {
        noCreate: true,
        changes: [
          DDBEnricherData.ChangeHelper.addChange("@abilities.wis.mod", 20, "system.abilities.con.bonuses.save"),
        ],
      },
    ];
  }

}
