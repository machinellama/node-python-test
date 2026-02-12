// Simple dynamic-function API server
// PORT can be changed here
const PORT = process.env.PORT || 3200;

const fs = require("fs");
const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

const FUNCTIONS_DIR = path.join(__dirname, "functions");

function registerEndpoint(name, fn) {
  const route = `/${name}`;
  app.post(route, async (req, res) => {
    const input = req.body || {};
    try {
      // Call function: if it expects (input) or expects named args, pass input as object.
      // Developers can destructure in their function signature.
      const result = await fn(input);
      res.json({ input, output: result });
    } catch (err) {
      res.status(500).json({ input, error: String(err) });
    }
  });
}

function discoverAndRegister() {
  if (!fs.existsSync(FUNCTIONS_DIR)) return;
  const files = fs.readdirSync(FUNCTIONS_DIR);
  files.forEach((file) => {
    if (!file.endsWith(".js") || file.startsWith("_")) return;
    const name = path.basename(file, ".js");
    const modPath = path.join(FUNCTIONS_DIR, file);
    try {
      const mod = require(modPath);
      // prefer exported 'run' or exported function matching filename, otherwise default export or first function export
      let fn = null;
      if (typeof mod.run === "function") fn = mod.run;
      else if (typeof mod[name] === "function") fn = mod[name];
      else if (typeof mod === "function") fn = mod;
      else {
        const keys = Object.keys(mod).filter(k => typeof mod[k] === "function");
        if (keys.length) fn = mod[keys[0]];
      }
      if (fn) registerEndpoint(name, fn);
    } catch (err) {
      console.error(`Failed to load function ${file}:`, err);
    }
  });
}

discoverAndRegister();

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
