 
// { speaker, actor, token, character, item, rolledItem, macroItem, args, scope, workflow }

export default async function test({
  speaker, actor, token, character, item, rolledItem, macroItem,
  args, scope, workflow,
} = {}) {

  console.warn("TEST", {
    speaker,
    actor,
    token,
    character,
    item,
    rolledItem,
    macroItem,
    args,
    scope,
    workflow,
  });

  let variables = "";
   
  for (const name in this) variables += name + "\n";

  console.warn("VARIABLES", variables);
}
