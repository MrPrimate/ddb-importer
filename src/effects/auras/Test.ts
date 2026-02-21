/* eslint-disable no-console */
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
  // eslint-disable-next-line no-invalid-this
  for (var name in this) variables += name + "\n";

  console.warn("VARIABLES", variables);
}
