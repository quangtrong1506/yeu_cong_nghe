const homeRouter = require("./home");

function route(app) {
  app.get("/api/:slug", homeRouter);
  app.get("/api", homeRouter);
  app.get("/show", homeRouter);
  app.get("/", homeRouter);
}
module.exports = route;
