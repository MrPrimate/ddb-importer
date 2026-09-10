import DDBEnricherData from "../data/DDBEnricherData";

export default class MoonSickle extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        noCreate: true,
        changes: [
          // "When you cast a spell that restores hit points", so cantrips count but Lay on Hands
          // and other non-spell healing do not; the filter reads the rolled spell under roll.item, not the sickle.
          DDBEnricherData.ChangeHelper.healingBonusChange("1d4", 20, DDBEnricherData.ChangeHelper.SPELL_FILTER),
        ],
      },
    ];
  }

}
