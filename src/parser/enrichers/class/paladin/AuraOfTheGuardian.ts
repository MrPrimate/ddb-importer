import Generic from "../Generic";

export default class AuraOfTheGuardian extends Generic {

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Aura of the Guardian",
        daeStackable: "none",
        data: {
          flags: {
            ActiveAuras: {
              aura: "All",
              radius: `@scale.${this.subclassIdentifier("Oath of Redemption")}.aura-of-the-guardian`,
              isAura: true,
              ignoreSelf: true,
              inactive: false,
              hidden: false,
              displayTemp: true,
            },
          },
        },
        auraeffects: {
          applyToSelf: false,
          bestFormula: "",
          canStack: false,
          collisionTypes: ["move"],
          combatOnly: false,
          disableOnHidden: true,
          distanceFormula: `@scale.${this.subclassIdentifier("Oath of Redemption")}.aura-of-the-guardian`,
          disposition: 0,
          evaluatePreApply: true,
          overrideName: "",
        },
        options: {
          transfer: true,
        },
      },
    ];
  }

}
