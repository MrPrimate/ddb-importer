const queryId = async () => {
  let { id, name, isGM } = game.user;
  let entities = game.actors.entities
    .filter((actor) => actor.owner)
    .map((actor) => {
      let aliases = game.scenes.active
        ? [
            ...new Set(
              game.scenes.active.data.tokens
                .filter((token) => {
                  return token.actorId === actor.id && token.name !== actor.name;
                })
                .map((token) => token.name)
            ),
          ]
        : [];
      return {
        type: "id",
        id: actor.id,
        name: actor.name,
        aliases: aliases,
      };
    });

  return {
    user: {
      id: id,
      name: name,
      isGM: isGM,
    },
    entities: entities,
    img: window.location.href.replace("/game", "/icons/svg/d20-highlight.svg"),
  };
};

export default queryId;
