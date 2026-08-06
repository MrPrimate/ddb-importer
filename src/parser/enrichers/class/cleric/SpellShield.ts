import DDBEnricherData from "../../data/DDBEnricherData";

export default class SpellShield extends DDBEnricherData {

  get useDefaultAdditionalActivities() {
    return true;
  }

  get type(): IDDBActivityType | null {
    return this.isAction ? DDBEnricherData.ACTIVITY_TYPES.HEAL : DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  get activity(): IDDBActivityData | null {
    if (!this.isAction) return null;
    return {
      addItemConsume: true,
      itemConsumeTargetName: "Channel Divinity",
      targetType: "creature",
      data: {
        healing: DDBEnricherData.basicDamagePart({
          customFormula: "1d10 + @classes.cleric.levels",
          types: ["temphp"],
        }),
        range: {
          units: "ft",
          value: "30",
        },
      },
    };
  }

  get effects(): IDDBEffectHint[] {
    if (!this.isAction) return [];
    return [
      {
        name: "Spell Shield",
        options: {
          durationSeconds: 600,
          description: "While any of these Temporary Hit Points remain, the creature has Advantage on saving throws against spells and Resistance to the damage of spells.",
        },
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange("1", 5, "flags.midi-qol.magicResistance.all"),
        ],
      },
    ];
  }

}
