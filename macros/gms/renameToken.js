const onSubmit = async (tokens, doc) => {
  const newName = doc.find("input[name=new-name]")[0].value;
  const updates = tokens.map((token) => {
    const update = {
      _id: token.id,
      actorData: {
        name: newName,
      },
      name: newName,
    };
    console.log(`Changing ${token.name} to ${newName}`, update);
    return update;
  });
  game.canvas.scene.updateEmbeddedDocuments("Token", updates);
};

const showDialog = async (tokens) => {
  return new Promise((resolve) => {
    // const tokenNames = [...new Set(tokens.map((a) => a.name))];
    // const tokenName = tokenNames.length === 1 ? tokenNames[0] : "";
    new Dialog({
      title: 'Change Actor(s) Name & Token Name',
      content: `<form>
<div class="form-group">
  <label for="new-name">Name</label><input type="text" name="new-name" id="new-name" placeholder="" />
</div>
</form>`,
      buttons: {
        change: {
          label: "Change!",
          callback: async (input) => {
            resolve(await onSubmit(tokens, input));
          }
        }
      },
      default: "change",
      close: () => resolve(null),
      render: (doc) => {
        const target = doc.find("input[name=new-name]")[0];
        target.focus();
        target.value = "";
      }
    }).render(true);
  });
};


showDialog(game.canvas.tokens.controlled);
// $("#new-name")[0].focus();
