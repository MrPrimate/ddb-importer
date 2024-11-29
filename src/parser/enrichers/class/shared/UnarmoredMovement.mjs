/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class UnarmoredMovement extends DDBEnricherData {

  get effects() {
    const value = this.ddbParser.ddbData?.character?.modifiers && this.is2024
      ? this.ddbParser.ddbData.character.modifiers.class.filter((mod) => mod.isGranted
        && mod.friendlySubtypeName === "Unarmored Movement").reduce((acc, mod) => acc + mod.value, 0)
      : 10;
    return [{
      noCreate: true,
      changesOverwrite: true,
      changes: [
        // can't use scale values here yet
        DDBEnricherData.ChangeHelper.unsignedAddChange(`${value}`, 20, "system.attributes.movement.walk"),
      ],
    }];
  }

}
