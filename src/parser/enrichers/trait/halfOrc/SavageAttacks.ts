import DDBEnricherData from "../../data/DDBEnricherData";

export default class SavageAttacks extends DDBEnricherData {

  get effects(): IDDBEffectHint[] {
    return [
      {
        options: {
          transfer: true,
        },
        changes: [
          DDBEnricherData.ChangeHelper.overrideChange("true", 20, "flags.dnd5e.savageAttacks"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("+1", 20, "flags.dnd5e.meleeCriticalDamageDice"),
        ],
      },
    ];
  }

}
