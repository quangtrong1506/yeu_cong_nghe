const express = require("express");
const router = express.Router();

const apiController = require("../app/controllers/apiController");
router.use("/api/happy-birthday", apiController.index);
module.exports = router;
