import DDBEnricherData from "../../data/DDBEnricherData";
import type DDBClassFeatureEnricher from "../../DDBClassFeatureEnricher";

/**
 * 2024: spend 1 Focus Point to cast Darkness (plus a darkvision transfer effect and Minor
 * Illusion known, which DDB grants as a spell). 2014: spend 2 ki to cast one of four spells.
 */
export default class ShadowArts extends DDBEnricherData<DDBClassFeatureEnricher> {

  static SPELLS_2014 = ["Darkness", "Darkvision", "Pass without Trace", "Silence"];

  get focusName(): string {
    return this.ddbEnricher.isParentClass2014 ? "Ki" : "Monk's Focus";
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.CAST;
  }

  _cast(spell: string): IDDBActivityData {
    return {
      name: `Cast ${spell}`,
      addSpellUuid: spell,
      addItemConsume: true,
      itemConsumeTargetName: this.focusName,
      itemConsumeValue: this.is2014 ? 2 : 1,
      noSpellslot: true,
      data: {
        spell: {
          spellbook: true,
          properties: [],
        },
      },
    };
  }

  override get activity(): IDDBActivityData {
    return this._cast("Darkness");
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (!this.is2014) return [];
    return ShadowArts.SPELLS_2014.slice(1).map((spell) => ({
      duplicate: true,
      overrides: this._cast(spell),
    }));
  }

  override get effects(): IDDBEffectHint[] {
    if (this.is2014) return [];
    return [
      {
        name: "Shadow Arts: Darkvision",
        options: {
          transfer: true,
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("60", 20, "system.attributes.senses.ranges.darkvision"),
        ],
      },
    ];
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

}
