import DDBEnricherData from "../../data/DDBEnricherData";

export default class GiftOfTheDepths extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.CAST;
  }

  get activity(): IDDBActivityData {
    return {
      addSpellUuid: "Water Breathing",
      data: {
        spell: {
          spellbook: true,
        },
        consumption: {
          "targets": [
            {
              "type": "itemUses",
              "value": "1",
              "target": "",
              "scaling": {
                "mode": "",
              },
            },
          ],
        },
      },
    };
  }

  get override(): IDDBOverrideData {
    return {
      uses: this._getSpellUsesWithSpent({
        name: "Gift of the Depths",
        type: "class",
      }),
    };
  }
}
