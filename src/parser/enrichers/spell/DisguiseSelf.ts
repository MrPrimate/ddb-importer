import DDBEnricherData from "../data/DDBEnricherData";

/**
 * A form-mode transform with a single form: casting applies Disguised to the caster and "No Form"
 * drops it. The effect changes no token art because the look is the player's choice; a
 * `token.texture.src` override can be added to the effect by hand. Observers see through it with
 * a Study Check.
 */
export default class DisguiseSelf extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.TRANSFORM;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Disguise",
      data: {
        ...DDBEnricherData.formTransformData({ formless: true }),
      },
    };
  }

  // the parser's Study Check comes from "takes the Study action to examine", which this text does not use
  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Study Check",
          type: DDBEnricherData.ACTIVITY_TYPES.CHECK,
        },
        build: {
          generateCheck: true,
          generateTarget: false,
          generateRange: false,
          generateConsumption: false,
          noSpellslot: true,
          noeffect: true,
          checkOverride: {
            associated: ["inv"],
            ability: "",
            dc: {
              calculation: "spellcasting",
              formula: "",
            },
          },
          activationOverride: {
            type: "special",
            override: true,
            condition: this.is2014 ? "Action to inspect your appearance" : "Study Action to Investigate",
          },
          rangeOverride: {
            units: "any",
            override: true,
          },
          targetOverride: {
            affects: {
              type: "self",
            },
            override: true,
          },
          durationOverride: {
            units: "inst",
            override: true,
          },
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        activityMatch: "Disguise",
        // a form is cloned straight onto the caster, so the spell's hour has to sit on the effect
        options: {
          transfer: false,
          durationSeconds: 3600,
        },
        statuses: ["Disguised"],
      },
    ];
  }

}
