import DDBEnricherData from "../data/DDBEnricherData";

export default class Eyebite extends DDBEnricherData {

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Asleep",
        data: {
          img: "systems/dnd5e/icons/svg/statuses/unconscious.svg",
        },
        statuses: ["Unconscious"],
      },
      {
        name: "Panicked",
        data: {
          img: "systems/dnd5e/icons/svg/statuses/frightened.svg",
        },
        statuses: ["Frightened"],
      },
      {
        name: "Sickened",
        data: {
          img: "systems/dnd5e/icons/svg/statuses/poisoned.svg",
        },
        statuses: this.is2014 ? [] : ["Poisoned"],
      },
    ];
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        duplicate: true,
        overrides: {
          name: "Concentration Action",
          noSpellslot: true,
        },
      },
    ];
  }

}
