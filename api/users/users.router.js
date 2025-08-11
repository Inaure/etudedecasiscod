const express = require("express");
const usersController = require("./users.controller");
const router = express.Router();

router.get("/", authMiddleware, usersController.getAll);
router.get("/:id/articles", usersController.getArticlesByUserId);
router.get("/:id", authMiddleware, usersController.getById);
router.post("/", authMiddleware, usersController.create);
router.put("/:id", authMiddleware, usersController.update);
router.delete("/:id", authMiddleware, usersController.delete);

module.exports = router;
