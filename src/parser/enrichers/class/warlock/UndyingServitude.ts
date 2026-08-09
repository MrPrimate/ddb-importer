import DDBEnricherData from "../../data/DDBEnricherData";

export default class UndyingServitude extends DDBEnricherData {

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.CAST;
  }

  override get activity(): IDDBActivityData {
    return {
      addSpellUuid: "Animate Dead",
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

  override get override(): IDDBOverrideData {
    return {
      uses: this._getSpellUsesWithSpent({
        name: "Undying Servitude",
        type: "class",
      }),
    };
  }
}
