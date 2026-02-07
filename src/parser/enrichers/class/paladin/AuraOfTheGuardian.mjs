/* eslint-disable class-methods-use-this */
import Generic from "../Generic.mjs";

export default class AuraOfTheGuardian extends Generic {

  get effects() {
    return [
      {
        name: "Aura of the Guardian",
        daeStackable: "none",
        data: {
          flags: {
            ActiveAuras: {
              aura: "All",
              radius: "@scale.redemption.aura-of-the-guardian",
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
          distanceFormula: "@scale.redemption.aura-of-the-guardian",
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
