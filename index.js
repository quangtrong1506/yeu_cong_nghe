const express = require("express");
const { engine } = require("express-handlebars");
const path = require("path");
const app = express();

app.engine("handlebars", engine());
app.set("view engine", "handlebars");
app.set("views", path.join(path.dirname(__dirname), "back-end/views"));
app.use(express.static(path.join(path.dirname(__dirname), "back-end/public")));

const route = require("./src/routes");

route(app);
app.listen(3000, () => {
  console.log(`Example app listening on port http://localhost:3000/`);
});
