const homeRouter = require("./home");
const apiRouter = require("./api");

function route(app) {
  app.get("/api/happy-birthday", apiRouter);
  app.get("/", homeRouter);
}
module.exports = route;
