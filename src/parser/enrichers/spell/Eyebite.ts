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
          // the spell's duration without concentration, so using it does not restart concentration;
          // the condition's effect carries the spell's duration itself (dnd5e 5.x does not copy this one)
          data: { duration: this.followUpDuration },
          noSpellslot: true,
        },
      },
    ];
  }

}
