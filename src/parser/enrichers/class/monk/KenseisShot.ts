import DDBEnricherData from "../../data/DDBEnricherData";

export default class KenseisShot extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  get activity() {
    return {
      data: {
        damage: DDBEnricherData.basicDamagePart({
          number: 1,
          denomination: 4,
          types: DDBEnricherData.allDamageTypes(),
        }),
      },
    };
  }

  // get effects(): IDDBEffectHint[] {
  //   return [
  //     {
  //       midiOnly: true,
  //       options: {
  //         transfer: true,
  //       },
  //       midiOptionalChanges: [{
  //         name: "deftStrike",
  //         data: {
  //           label: `${document.name} Additional Damage`,
  //           count: "turn",
  //           "damage.all": "@scale.monk.die",
  //           countAlt: "ItemUses.Ki",
  //           criticalDamage: "1",
  //         },
  //       }],
  //     },
  //   ];
  // }

}
