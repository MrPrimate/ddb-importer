/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class SpellStoringItemStoreSpell extends DDBEnricherData {

  get type() {
    return "ddbmacro";
  }

  get activity() {
    const uses = this._getUsesWithSpent({
      type: "class",
      name: "Spell-Storing Item: Store Spell",
    });
    return {
      noConsumeTargets: true,
      addActivityConsume: true,
      data: {
        name: "Store Spell in Item",
        macro: {
          name: "Store Spell in Item",
          function: "ddb.generic.spellStoring",
          visible: false,
          parameters: JSON.stringify({
            action: "store-spell",
            flag: "spell-storing-item",
            spellList: "artificer",
            rules: "2024",
          }),
        },
        uses,
      },
    };
  }

}
