import DDBEnricherData from "../../data/DDBEnricherData";

export default class DeftStrike extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  get activity(): IDDBActivityData {
    return {
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: `@scale.${this.classIdentifier("Monk")}.die`,
              types: DDBEnricherData.allDamageTypes(),
            }),
          ],
        },
      },
    };
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        midiOnly: true,
        options: {
          transfer: true,
        },
        midiOptionalChanges: [{
          name: "deftStrike",
          data: {
            label: `${this.data.name} Additional Damage`,
            count: "turn",
            "damage.all": `@scale.${this.classIdentifier("Monk")}.die`,
            countAlt: "ItemUses.Ki",
            criticalDamage: "1",
          },
        }],
      },
    ];
  }

}
