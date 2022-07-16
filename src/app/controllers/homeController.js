class HomeController {
  index(req, res, next) {
    res.render("home");
  }
  show(req, res, next) {
    res.render("show");
  }
}

module.exports = new HomeController();
