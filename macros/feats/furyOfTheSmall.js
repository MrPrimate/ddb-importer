if (args[0].tag !== "OnUse" && args[0].macroPass !== 'preDamageRoll') return;

const target = workflow.hitTargets.first().actor;
const isSmaller = DDBImporter?.EffectHelper.isSmaller(actor,target);

if (isSmaller) {
  return workflow.actor.effects.getName('Fury of the Small').update({ disabled:false });
} else {
  return workflow.actor.effects.getName('Fury of the Small').update({ disabled:true });
}
