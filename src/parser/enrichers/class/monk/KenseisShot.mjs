/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class KenseisShot extends DDBEnricherData {

  get type() {
    return "damage";
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

  // get effects() {
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
  //           "damage.all": "@scale.monk.martial-arts",
  //           countAlt: "ItemUses.Ki",
  //           criticalDamage: "1",
  //         },
  //       }],
  //     },
  //   ];
  // }

}
