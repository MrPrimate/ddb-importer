/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class EmptyBody extends DDBEnricherData {
  get activity() {
    return {
      name: "Go Invisible",
      targetType: "self",
    };
  }

  get effects() {
    return [
      {
        options: {
          durationSeconds: 60,
        },
        activityNameMatch: "Go Invisible",
        statuses: ["invisible"],
        changes: DDBEnricherData.allDamageTypes(["force"]).map((element) =>
          DDBEnricherData.ChangeHelper.unsignedAddChange(element, 20, "system.traits.dr.value"),
        ),
      },
    ];
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Astral Projection",
          type: "cast",
        },
        build: {
          generateConsumption: false,
          generateSpell: true,
        },
        overrides: {
          addSpellUuid: "Astral Projection",
          addItemConsume: true,
          itemConsumeTargetName: "Ki",
          itemConsumeValue: 8,
          data: {
            spell: {
              properties: ["material"],
              spellbook: true,
            },
          },
        },
      },
    ];
  }
}
