/**
 *
 *
 */

function buildBaseEffect() {
  let effect = {
    changes: [],
    duration: {
      seconds: null,
      startTime: null,
      rounds: null,
      turns: null,
      startRound: null,
      startTurn: null,
    },
    label: "",
    tint: "",
    disabled: false,
    selectedKey: [],
  };
  return effect;
}


import { ABILITIES, getAbilityMods } from "../muncher/monster/abilities.js";
import { SKILLS } from "../muncher/monster/skills.js";


function exampleEffectExtra(actor) {
  let effect = buildBaseEffect();
  ABILITIES.filter((ability) => actor.data.abilities[ability.value].proficient >= 1)
  .forEach((ability) => {
    const boost = {
      key: `data.abilities.${ability.value}.save`,
      mode: 2,
      value: characterProficiencyBonus,
      priority: 20,
    };
    effect.selectedKey.push(`data.abilities.${ability.value}.save`);
    effect.changes.push(boost);
  });
  SKILLS.filter((skill) => actor.data.skills[skill.name].prof >= 1)
    .forEach((skill) => {
      const boost = {
        key: `data.skills.${skill.name}.mod`,
        mode: 2,
        value: characterProficiencyBonus,
        priority: 20,
      };
      effect.selectedKey.push(`data.skills.${skill.name}.mod`);
      effect.changes.push(boost);
    });
  actor.effects = [effect];
}
