import DDBEnricherData from "../../data/DDBEnricherData";

export default class DeftStrike extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  get activity() {
    return {
      data: {
        damage: DDBEnricherData.basicDamagePart({
          customFormula: "@scale.monk.die",
          types: DDBEnricherData.allDamageTypes(),
        }),
      },
    };
  }

  get effects() {
    return [
      {
        midiOnly: true,
        options: {
          transfer: true,
        },
        midiOptionalChanges: [{
          name: "deftStrike",
          data: {
            label: `${document.name} Additional Damage`,
            count: "turn",
            "damage.all": "@scale.monk.die",
            countAlt: "ItemUses.Ki",
            criticalDamage: "1",
          },
        }],
      },
    ];
  }

}
