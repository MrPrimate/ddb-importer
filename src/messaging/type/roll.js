/**
 * Re-creates a roll based on the 3D Die roll from dndbeyond
 * @param {string} formula the formula to roll to
 * @param {array} resultParts The resulting die coming from dndbeyond
 * @param {*} total the result coming from dndbeyond
 */
const doFakeRoll = (formula, resultParts, total) => {
  let roll = new Roll(formula).roll();

  let combined = [];

  // adjust all rolled die
  roll.parts = roll.parts.map((part) => {
    if (typeof part === "object") {
      // class Die
      // we will insert pats of resultParts into this Die
      part.rolls = part.rolls.map((dieRoll) => {
        dieRoll.roll = resultParts.shift();
        combined.push(dieRoll.roll);
        return dieRoll;
      });
    } else if (typeof part === "string" && !isNaN(part)) {
        combined.push(resultParts.shift());
      }
    return part;
  });
  roll._result = combined.reduce((total, cur) => `${total} ${cur < 0 ? "-" : "+"} ${Math.abs(cur)}`);
  roll._total = total;
  return roll;
};

export default function (entity, data) {
  return new Promise((resolve, reject) => {
    let roll = data.roll;
    let event = data.event;

    switch (roll.rollType) {
      case "3D": {
        // get the desired actor

        let flavor = roll.flavor;
        let [what, how] = roll.flavor.split(":").map((i) => i.trim());
        const attributes = ["str", "dex", "con", "int", "wis", "cha"];
        if (attributes.includes(what)) {
          switch (how) {
            case "check":
              flavor = CONFIG.DND5E.abilities[what] + " - Ability Check";
              break;
            case "roll":
              flavor = CONFIG.DND5E.abilities[what] + " - Saving Throw";
              break;
            // no default
          }
        } else {
          switch (how) {
            case "check":
              flavor = what + " Skill Check";
              break;
            case "to hit":
              flavor = what + " - Attack Roll";
              break;
            case "damage":
              flavor = what + " - Damage Roll";
              break;
            default:
              flavor = what + " - " + how;
          }
        }
        // re-create the roll in Foundry
        doFakeRoll(roll.formula, roll.parts, roll.total).toMessage(
          {
            speaker: ChatMessage.getSpeaker({ actor: entity }),
            flavor: flavor,
          },
          { create: true }
        );
        resolve({ body: "3D die successfully rendered" });

        break;
      }
      case "ABILITY": {
        switch (roll.subtype) {
          case "SAVE":
            entity.rollAbilitySave(roll.name, { event: event });
            resolve({ body: "Ability save rendered successfully" });
            break;
          case "CHECK":
            entity.rollAbility(roll.name, { event: event });
            resolve({ body: "Ability save rendered successfully" });
            break;
          // no default
        }
        break;
      }
      case "SKILL": {
        entity.rollSkill(roll.name, { event: event });
        resolve({ body: "Ability save rendered successfully" });
        break;
      }
      default: {
        let item = entity.items.find((item) => item.name === roll.name);
        if (item) {
          // Roll spells through the actor
          if (item.data.type === "spell") {
            return entity.useSpell(item, { configureDialog: !event.shiftKey });
          } else {
            // Otherwise roll the Item directly
            return item.roll();
          }
        } else {
          reject("Unknown item");
        }
        break;
      }
    }

    return reject("Unknown roll command");
  });
}
