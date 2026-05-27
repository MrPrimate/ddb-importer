import DDBEnricherData from "../../data/DDBEnricherData";

export default class TrickstersEscape extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.CAST;
  }

  get activity(): IDDBActivityData {
    return {
      addSpellUuid: "Freedom of Movement",
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
        name: "Trickster's Escape",
        type: "class",
      }),
    };
  }
}
