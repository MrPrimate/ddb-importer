/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class Absorption extends DDBEnricherData {

  get effects() {
    const absRegEx = /is subjected to (\w+) damage, it takes no damage and (?:instead )?regains a number of hit points equal to (half )?the (\w+) damage/i;
    const match = absRegEx.exec(this.ddbParser.strippedHtml);

    if (!match) return [];
    const value = match[2] ? "0.5" : "1";
    return [
      {
        options: {
          transfer: true,
        },
        name: `Absorption: ${match[1]}`,
        midiOnly: true,
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange(value, 20, `system.traits.da.${match[1]}`),
        ],
        img: "icons/svg/downgrade.svg",
      },
    ];
  }

}
