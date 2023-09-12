const CleanCSS = require("clean-css");
const fs = require("fs");
const path = require("path");

let SOURCE_LOC = "https://github.com/coo11/Index/tree/master/";
let CNAME = "t.ehhh.eu.org";

function prefix(css) {
  return `<!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <title>Tools Index</title>
      <style>
${css}
      </style>
      <link type="text/css" rel="stylesheet" href="style.css" />
    </head>
    <body>
      <div id="page" class="mt-4">
        <h1>Tools Index</h1>
        <p>
          This is a tools checklist I used. Most of them are based on open source
          technology.
        </p>
        <table>
          <thead>
            <tr>
              <th class="item-column">Item</th>
              <th class="desc-column">Description</th>
            </tr>
          </thead>
          <tbody onclick="">
`;
}

function suffix() {
  return `        </tbody>
  </table>
</div>
<footer class="mt-4">
  <a href="https://github.com/coo11/Index" target="_blank">Github</a>
</footer>
</body>
</html>`;
}

function template(uri, name, desc) {
  return `    <tr>
      <td>
        <a href="${uri}" target="_blank">${name}</a>
      </td>
      <td>
        <p>${desc}</p>
      </td>
    </tr>
`;
}

function copyFolderRecursiveSync(sourceFolder, targetFolder) {
  const files = fs.readdirSync(sourceFolder);

  if (!fs.existsSync(targetFolder)) {
    fs.mkdirSync(targetFolder);
  }

  files.forEach(file => {
    const sourceFilePath = path.join(sourceFolder, file);
    const targetFilePath = path.join(targetFolder, file);

    if (fs.lstatSync(sourceFilePath).isDirectory()) {
      copyFolderRecursiveSync(sourceFilePath, targetFilePath);
    } else {
      fs.copyFileSync(sourceFilePath, targetFilePath);
    }
  });
}

(async () => {
  if (fs.existsSync("./dist"))
    fs.rmSync("./dist", { recursive: true, force: true });
  fs.mkdirSync("dist/");

  let css = fs.readFileSync("style.css", "utf-8");
  css = new CleanCSS().minify(css).styles;
  let data = JSON.parse(fs.readFileSync("items.json", "utf-8"));
  let content = "";
  for (let item of data) {
    let url = item.view;
    if (!url) {
      copyFolderRecursiveSync("./src/" + item.path, "./dist/" + item.path);
      url = `https://${CNAME}/${item.path}`;
    }
    content += template(url, item.name, item.desc);
  }
  fs.writeFileSync("./dist/index.html", `${prefix(css)}${content}${suffix()}`);
})();
