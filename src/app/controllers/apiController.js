class apiController {
  index(req, res, next) {
    res.render("hb", { layout: "api", api: req.query, name: req.query.name });
  }
}

module.exports = new apiController();
