import DDBEnricherData from "../data/DDBEnricherData";

export default class AuraOfPurity extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Cast",
      data: {
        behaviors: [
          DDBEnricherData.BehaviorHelper.applyEffect({
            effects: [
              DDBEnricherData.SRDEffects.damageResistance("poison"),
              "Aura of Purity",
            ],
          }),
        ],
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    const statuses = ["blinded", "charmed", "deafened", "frightened", "paralyzed", "poisoned", "stunned"];
    return [
      {
        name: "Aura of Purity",
        standalone: true,
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange(
            statuses.map((status) => `riderStatuses.${status}`).join(" || "),
            20,
            "flags.automated-conditions-5e.save.advantage",
          ),
        ],
        options: {
          durationSeconds: 600,
          description: "Advantage on saving throws to avoid or end the Blinded, Charmed, Deafened, Frightened, Paralyzed, Poisoned and Stunned conditions.",
        },
      },
    ];
  }


  override get override(): IDDBOverrideData {
    return {
      data: {
        system: {
          target: {
            affects: {
              type: "ally",
            },
          },
        },
      },
    };
  }

}
