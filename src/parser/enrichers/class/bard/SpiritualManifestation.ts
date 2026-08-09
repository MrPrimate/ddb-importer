import DDBEnricherData from "../../data/DDBEnricherData";

export default class SpiritualManifestation extends DDBEnricherData {

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.CAST;
  }

  override get activity(): IDDBActivityData {
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

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Spiritual Manifestation - Cover",
        statuses: ["HalfCover"],
        activityMatch: "Spirit Guardians",
      },
    ];
  }

}
