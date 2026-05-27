import DDBEnricherData from "../../data/DDBEnricherData";

export default class MinionsOfChaos extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.CAST;
  }

  get activity(): IDDBActivityData {
    return {
      addSpellUuid: "Conjure Elemental",
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

  get override(): IDDBOverrideData {
    return {
      uses: this._getSpellUsesWithSpent({
        name: "Minions of Chaos",
        type: "class",
      }),
    };
  }
}
