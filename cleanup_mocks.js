const fs = require("fs");
const path = require("path");

const rootDir = __dirname;
const patterns = ["mock", "fake", "placeholder"];
const exclude = ["node_modules", ".git", "cleanup_mocks.js"];

function searchFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function (file) {
    if (exclude.includes(file)) return;
    file = path.resolve(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(searchFiles(file));
    } else {
      const filename = path.basename(file).toLowerCase();
      if (patterns.some((p) => filename.includes(p))) {
        results.push(file);
      }
    }
  });
  return results;
}

const found = searchFiles(rootDir);
console.log(`Found ${found.length} potential mock files:`);
found.forEach((f) => console.log(f));

if (process.argv.includes("--delete")) {
  console.log("\nDeleting files...");
  found.forEach((f) => {
    try {
      fs.unlinkSync(f);
      console.log(`Deleted: ${f}`);
    } catch (e) {
      console.error(`Failed to delete ${f}: ${e.message}`);
    }
  });
  console.log("Cleanup complete.");
} else {
  console.log("\nRun with --delete to actually remove these files.");
}
