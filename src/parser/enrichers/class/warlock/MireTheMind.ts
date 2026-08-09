import DDBEnricherData from "../../data/DDBEnricherData";

export default class MireTheMind extends DDBEnricherData {

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.CAST;
  }

  override get activity(): IDDBActivityData {
    return {
      addSpellUuid: "Slow",
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
            {
              "type": "attribute",
              "value": "1",
              "target": "spells.pact.value",
              "scaling": {
                "mode": "",
                "formula": "",
              },
            },
          ],
          "scaling": {
            "allowed": true,
            "max": "9",
          },
          "spellSlot": true,
        },
      },
    };
  }

  override get override(): IDDBOverrideData {
    return {
      uses: this._getSpellUsesWithSpent({
        name: "Mire the Mind",
        type: "class",
      }),
    };
  }
}
