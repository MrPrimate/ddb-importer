import MonsterMuncher from "../../monster/munch.js";

// export default function addMonsterMuncher() {
//   // Set up the user interface
//   Hooks.on("renderSidebarTab", async (app, html) => {
//     if (app.options.id == "compendium") {
//       let button = $("<button class='monster-muncher'><i class='fas fa-file-import'></i> Monster Muncher</button>")

//       button.click(function () {
//         new MonsterMuncher().render(true);
//       });

//       html.find(".directory-footer").append(button);
//     }
//   })
// }


export default function (app, html) {
  $(html)
  if (app.options.id == "compendium") {
    let button = $("<button class='monster-muncher'><i class='fas fa-file-import'></i> Monster Muncher</button>")

    button.click(function () {
      new MonsterMuncher().render(true);
    });

    $(html).find(".directory-footer").append(button);
  }
}
