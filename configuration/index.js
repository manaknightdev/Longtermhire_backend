const fs = require("fs");
const path = require("path");

module.exports = function (app) {
  fs.readdirSync(__dirname).forEach(function (file) {
    if (file === "lambda") {
      const lambdaPath = path.join(__dirname, "lambda");
      if (fs.existsSync(lambdaPath)) {
        // Read files in lambda directory
        fs.readdirSync(lambdaPath).forEach(function (file) {
          // Skip non-JavaScript files and index.js
          if (file === "index.js" || path.extname(file) !== ".js") {
            return;
          }

          // Skip .DS_Store or other system files
          if (file === ".DS_Store") {
            return;
          }

          // Require the lambda file
          const name = path.basename(file, ".js");
          require(path.join(lambdaPath, name))(app);
        });
      }
      return;
    }
    if (file === "index.js" || file === ".DS_Store") return;
    // ignore .sql, .json
    if (
      file.substr(file.lastIndexOf(".") + 1) === "sql" ||
      file.substr(file.lastIndexOf(".") + 1) === "json"
    ) {
      return;
    }
    try {
      if (file.substr(file.lastIndexOf(".") + 1) !== "js") {
        require("./" + file + "/index.js")(app);
        return;
      }

      const name = file.substr(0, file.indexOf("."));
      console.log("loading file: " + name);
      require("./" + name)(app);
    } catch (error) {
      console.log("ignoring file: " + file);
    }
  });
};

// const fs = require("fs");
// const path = require("path");

// module.exports = function (app) {
//   fs.readdirSync(__dirname).forEach(function (file) {
//     if (file ==="lambda") {
//       const lambdaPath = path.join(__dirname, "lambda");
//       if (fs.existsSync(lambdaPath)) {
//           // Read files in lambda directory
//           fs.readdirSync(lambdaPath).forEach(function (file) {
//               // Skip non-JavaScript files and index.js
//               if (file === "index.js" || path.extname(file) !== ".js") {
//                   return;
//               }

//               // Skip .DS_Store or other system files
//               if (file === ".DS_Store") {
//                   return;
//               }

//               // Require the lambda file
//               const name = path.basename(file, ".js");
//               try{
//                 require(path.join(lambdaPath, name))(app);
//               }catch(error){
//                 console.log("error loading file: " + file, error);
//               }
//           });
//       }
//       return;
//     }
//     if (file === "index.js" || file === ".DS_Store") return;
//     // ignore .sql, .json
//     if (file.substr(file.lastIndexOf(".") + 1) === "sql" || file.substr(file.lastIndexOf(".") + 1) === "json") {
//         return;
//     }
//     try{
//       if (file.substr(file.lastIndexOf(".") + 1) !== "js") {
//         require("./" + file + "/index.js")(app);
//         return;
//       }

//       const name = file.substr(0, file.indexOf("."));
//       require("./" + name)(app);
//     }catch(error){
//       console.log("error loading file: ", error);
//       console.log("ignoring file: " + file);
//     }
//   });
// };
