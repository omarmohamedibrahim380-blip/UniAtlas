/* Build the WordPress plugin assets and a self-contained preview page. */
"use strict";

const fs = require("fs");
const path = require("path");

const root = __dirname;
const src = path.join(root, "src");
const plugin = path.join(root, "plugin", "uniatlas");

const markup = fs.readFileSync(path.join(src, "markup.html"), "utf8");
const css = fs.readFileSync(path.join(src, "styles.css"), "utf8");
const js = fs.readFileSync(path.join(src, "app.js"), "utf8");

// Fail early on syntax errors.
new Function(js);

if (/<\/script/i.test(js)) {
  throw new Error("app.js contains a closing script tag and cannot be inlined safely.");
}

if (/<\/style/i.test(css)) {
  throw new Error("styles.css contains a closing style tag and cannot be inlined safely.");
}

const banner = `/* UniAtlas v2.0.0 — generated ${new Date().toISOString()} */\n`;

fs.mkdirSync(path.join(plugin, "templates"), { recursive: true });
fs.mkdirSync(path.join(plugin, "assets", "css"), { recursive: true });
fs.mkdirSync(path.join(plugin, "assets", "js"), { recursive: true });

fs.writeFileSync(path.join(plugin, "templates", "app.php"), markup, "utf8");
fs.writeFileSync(path.join(plugin, "assets", "css", "app.css"), banner + css, "utf8");
fs.writeFileSync(path.join(plugin, "assets", "js", "app.js"), banner + js, "utf8");

const preview = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#07080f">
<meta name="color-scheme" content="dark light">
<meta name="description" content="UniAtlas — أطلس جامعتك. اختار جامعتك من خريطة العالم، وابدأ من UniBg: خريطة تفاعلية، دليل مباني، مسار أكاديمي، إجراءات، بنك أسئلة، مجتمع، سكن، منح، وفرص تدريب.">
<title>UniAtlas — جامعتك… على الخريطة</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css">
<style>
${css}
</style>
</head>
<body class="uniatlas-fullscreen">
<a class="uniatlas-skip-link" href="#appMain">تخطَّ إلى المحتوى</a>
${markup}
<script src="https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
${js}
</script>
</body>
</html>
`;

fs.writeFileSync(path.join(root, "preview.html"), preview, "utf8");

const files = [
  ["plugin/templates/app.php", markup],
  ["plugin/assets/css/app.css", css],
  ["plugin/assets/js/app.js", js],
  ["preview.html", preview],
];

console.log("Build complete.");
for (const [file, content] of files) {
  console.log(`  ${file} — ${(Buffer.byteLength(content, "utf8") / 1024).toFixed(1)} KB`);
}
