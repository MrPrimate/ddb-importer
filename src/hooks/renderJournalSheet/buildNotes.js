function copyToClipboard(text) {
  var dummy = document.createElement("textarea");
  document.body.appendChild(dummy);
  dummy.value = text;
  dummy.select();
  document.execCommand("copy");
  document.body.removeChild(dummy);
}

var clippy = {};
var tableInUse = false;

function getNoteButton(name, type) {
  return $(
    `<a id='ddb-note-${name}' class='ddb-button'><i class='fas fa-clipboard-check'></i>&nbsp;Copy ${type} ${name} </a>`
  );
}

function getTableButton() {
  return $(
    `<a id='ddb-table-name' class='ddb-button'><i class='fas fa-clipboard-check'></i>&nbsp;Copy table details </a>`
  );
}

function buildNotes(html, data) {
  if (!game.user.isGM) return;
  const allow = game.settings.get("ddb-importer", "allow-note-generation");
  if (!allow) return;

  // mark all headers
  $(html)
    .find("h1, h2, h3, h4, h5, figure, p")
    .each((index, element) => {
      $(element).wrap("<div class='ddbimporter-note-container'></div>");
      // show the button on mouseenter
      $(element)
        .parent()
        .mouseenter(function Hovering() {
          if (tableInUse) return;
          const tagName = $(element).prop("tagName");
          const showStartButton = $(this).append(getNoteButton("start", tagName));
          const showEndButton = $(this).append(getNoteButton("end", tagName));
          $(showStartButton).click((e) => {
            // const src = $(element).attr("src");
            // In 0.8.x for some reason I need to now wrap these in the target id check?
            if (e.target.id === "ddb-note-start") {
              clippy = {
                ddbId: data.data.flags.ddb.ddbId,
                cobaltId: data.data.flags.ddb.cobaltId,
                parentId: data.data.flags.ddb.parentId,
                splitTag: tagName.toLowerCase(),
                slug: data.data.flags.ddb.slug,
                tagIdFirst: $(element).prop("id"),
                contentChunkIdStart: $(element).attr("data-content-chunk-id"),
                tagIdLast: "",
                contentChunkIdStop: "EOF",
                sceneName: data.data.name,
              };
              copyToClipboard(JSON.stringify(clippy, null, 2));
            }
          });
          $(showEndButton).click((e) => {
            if (e.target.id === "ddb-note-end") {
              clippy.tagIdLast = $(element).prop("id");
              clippy.contentChunkIdStop = $(element).attr("data-content-chunk-id");
              copyToClipboard(JSON.stringify(clippy, null, 2));
            }
          });
        });
      $(element)
        .parent()
        .mouseleave(function Unhovering() {
          $(this).find("#ddb-note-start").remove();
          $(this).find("#ddb-note-end").remove();
        });
    });

  // mark all headers
  $(html)
    .find("table")
    .each((index, element) => {
      $(element).wrap("<div class='ddbimporter-table-container'></div>");
      // show the button on mouseenter
      $(element)
        .parent()
        .mouseenter(function Hovering() {
          tableInUse = true;
          const showButton = $(this).append(getTableButton());
          $(showButton).click((e) => {
            if (e.target.id === "ddb-table-name") {
              clippy = {
                ddbId: data.data.flags.ddb.ddbId,
                cobaltId: data.data.flags.ddb.cobaltId,
                parentId: data.data.flags.ddb.parentId,
                slug: data.data.flags.ddb.slug,
                tagIdFirst: $(element).prop("id"),
                contentChunkId: $(element).attr("data-content-chunk-id"),
                sceneName: data.data.name,
                tableName: "",
              };
              copyToClipboard(JSON.stringify(clippy, null, 2));
            }
          });
        });
      $(element)
        .parent()
        .mouseleave(function Unhovering() {
          $(this).find("#ddb-table-name").remove();
          tableInUse = false;
        });
    });
}

export default buildNotes;
