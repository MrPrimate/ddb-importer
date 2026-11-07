import DDBEnricherData from "../../data/DDBEnricherData";

type TPetSpecialization = "Cunning" | "Ferocity" | "Tenacity";

const SPECIALIZATIONS: TPetSpecialization[] = ["Cunning", "Ferocity", "Tenacity"];

/**
 * Pet Specialization (World of Warcraft Hunter, Beast Mastery and Survival): while the primal beast
 * is within 60 feet, Cunning adds 10 feet to your Speed, Ferocity heals you and the beast by the Wis
 * modifier when the Bloodied beast hits with Beast's Strike, and Tenacity raises your Hit Point
 * maximum by 6 plus 1 per Ranger level. DDB grants the beast's once-per-Long-Rest spell (Freedom of
 * Movement, Haste, Stoneskin) as an innate spell and the per-level Hit Points as a modifier, so only
 * the flat 6 is added here. The pick is a DDB choice whose lone option merges into this document, so
 * the specialization comes from the chosen label (all three when none).
 */
export default class PetSpecialization extends DDBEnricherData {

  get specializations(): TPetSpecialization[] {
    const names = [
      ...(this.ddbParser._chosen ?? []).map((choice) => choice.label),
      this.data.name,
    ].map((name) => (name ?? "").trim());
    const chosen = SPECIALIZATIONS.filter((spec) => names.some((name) => name === spec || name.endsWith(`: ${spec}`)));
    return chosen.length > 0 ? chosen : SPECIALIZATIONS;
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  override get useDefaultAdditionalActivities(): boolean {
    return false;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    const activities: IDDBAdditionalActivity[] = [];
    if (this.specializations.includes("Ferocity")) {
      activities.push({
        init: { name: "Ferocity: Regain Hit Points", type: DDBEnricherData.ACTIVITY_TYPES.HEAL },
        build: {
          generateActivation: true,
          generateTarget: true,
          generateHealing: true,
          generateConsumption: false,
          activationOverride: { type: "special", value: 1, condition: "The Bloodied beast hits with Beast's Strike: you and the beast each regain" },
          targetOverride: { override: true, affects: { count: "2", type: "creature" } },
          healingPart: DDBEnricherData.basicDamagePart({ customFormula: "@abilities.wis.mod", types: ["healing"] }),
        },
      });
    }
    return activities;
  }

  override get effects(): IDDBEffectHint[] {
    const specs = this.specializations;
    const effects: IDDBEffectHint[] = [];
    if (specs.length !== 1) return effects;
    if (specs[0] === "Cunning") {
      effects.push({
        name: "Pet Specialization: Cunning",
        options: { transfer: true, description: "While your primal beast is within 60 feet of you, your Speed and all of its speeds increase by 10 feet." },
        changes: [DDBEnricherData.ChangeHelper.movementBonusChange(10)],
      });
    } else if (specs[0] === "Tenacity") {
      effects.push({
        name: "Pet Specialization: Tenacity",
        options: { transfer: true, description: "Your Hit Point maximum increases by 6 (DDB's modifier adds 1 per Ranger level); your primal beast's by your Ranger level." },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("6", 20, "system.attributes.hp.bonuses.overall"),
        ],
      });
    }
    return effects;
  }

}
