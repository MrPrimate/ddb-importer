import DDBEnricherData from "../data/DDBEnricherData";

export default class EnlargeReduce extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      // dnd5e 5.2 stores `system.traits.size` as a key ("med", "lg", ...), so an ADD change
      // concatenates rather than steps a category ("med1"/"med-1"). The step is relative to
      // whatever the target already is, so it cannot be an OVERRIDE either: with ATL the macro
      // effect below asks which way the spell was cast and resizes the token from its real size.
      {
        name: "Enlarged",
        options: {
          durationSeconds: 60,
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1d4", 20, "system.bonuses.mwak.damage"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("1d4", 20, "system.bonuses.rwak.damage"),
          DDBEnricherData.ChangeHelper.advantageAbilityCheckChange("str"),
          DDBEnricherData.ChangeHelper.advantageAbilitySaveChange("str"),
        ],
        atlNever: true,
      },
      {
        name: "Reduced",
        options: {
          durationSeconds: 60,
        },
        changes: [
          DDBEnricherData.ChangeHelper.subtractChange("1d4", 20, "system.bonuses.mwak.damage"),
          DDBEnricherData.ChangeHelper.subtractChange("1d4", 20, "system.bonuses.rwak.damage"),
          DDBEnricherData.ChangeHelper.disadvantageAbilityCheckChange("str"),
          DDBEnricherData.ChangeHelper.disadvantageAbilitySaveChange("str"),
        ],
        atlNever: true,
      },
      {
        name: "Enlarged/Reduced",
        atlOnly: true,
        options: {
          durationSeconds: 60,
        },
        macroChanges: [
          { macroType: "spell", macroName: "enlargeReduce.js", priority: 0 },
        ],
      },
    ];
  }

  override get itemMacro() {
    return {
      name: "enlargeReduce.js",
      type: "spell",
    };
  }

}
