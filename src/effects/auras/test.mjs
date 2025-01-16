// { speaker, actor, token, character, item, rolledItem, macroItem, args, scope, workflow }

export default async function test(arg1, arg2, arg3) {

  console.warn("TEST", {
    arg1,
    arg2,
    arg3,
    // args,
    arguments,
    scope,
  });

  let variables = ""
  for (var name in this)
      variables += name + "\n";

  console.warn("VARIABLES", variables);
}
