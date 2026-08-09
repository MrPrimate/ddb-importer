import DDBEnricherData from "../../data/DDBEnricherData";

export default class DivineStrike extends DDBEnricherData {
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
              customFormula: "@scale.order.divine-strike",
              types: ["psychic"],
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
            "damage.all": "@scale.order.divine-strike",
          },
        }],
      },
    ];
  }
}
