import DDBEnricherData from "../../data/DDBEnricherData";

export default class BrutalCritical extends DDBEnricherData {

  get effects(): IDDBEffectHint[] {
    return [
      {
        options: {
          transfer: true,
        },
        changes: [
          DDBEnricherData.ChangeHelper.signedAddChange("+1", 20, "flags.dnd5e.meleeCriticalDamageDice"),
        ],
      },
    ];
  }

}
