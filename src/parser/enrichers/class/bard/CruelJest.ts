import DDBEnricherData from "../../data/DDBEnricherData";

export default class CruelJest extends DDBEnricherData {

  get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  get type() {
    return this.isAction ? DDBEnricherData.ACTIVITY_TYPES.DAMAGE : DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      activationType: "reaction",
      activationCondition: "A creature you can see or hear within 30 ft fails a D20 Test",
      addItemConsume: true,
      itemConsumeTargetName: "Bardic Inspiration",
      data: {
        range: {
          value: 30,
          units: "ft",
        },
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "@scale.bard.inspiration + @abilities.cha.mod",
              types: ["psychic"],
            }),
          ],
        },
      },
    };
  }

  get effects(): IDDBEffectHint[] {
    if (!this.isAction) return [];
    return [
      {
        name: "Cruel Jest",
        options: {
          durationRounds: 1,
          description: "Disadvantage on the next D20 Test the creature makes before the end of its next turn.",
        },
        daeSpecialDurations: ["turnEnd"],
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.disadvantage.all"),
        ],
      },
    ];
  }

}
