import DDBEnricherData from "../../data/DDBEnricherData";

export default class BlessedStrikesDivineStrike extends DDBEnricherData {
  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      noeffect: true,
      activationType: "special",
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "@scale.cleric.divine-strike",
              types: ["radiant", "necrotic"],
            }),
          ],
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        midiOnly: true,
        options: {
          transfer: true,
        },
        midiOptionalChanges: [{
          name: "divineStrike",
          data: {
            label: `Divine Strike Bonus Damage`,
            count: "each-round",
            "damage.all": "@scale.cleric.divine-strike",
          },
        }],
      },
    ];
  }
}
