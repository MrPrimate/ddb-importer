import DDBEnricherData from "../../data/DDBEnricherData";

export default class SpiritualManifestation extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.CAST;
  }

  get activity(): IDDBActivityData {
    return {
      name: "Spirit Guardians",
      addSpellUuid: "Spirit Guardians",
      data: {
        spell: {
          spellbook: true,
        },
        consumption: {
          "targets": [
            {
              "type": "activityUses",
              "value": "1",
              "target": "",
              "scaling": {
                "mode": "",
              },
            },
          ],
        },
        uses: this._getSpellUsesWithSpent({
          name: "Empowered Channeling",
          type: "class",
        }),
      },
    };
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Spiritual Manifestation - Cover",
        statuses: ["HalfCover"],
        activityMatch: "Spirit Guardians",
      },
    ];
  }

}
