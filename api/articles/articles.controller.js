const NotFoundError = require("../../errors/not-found");
const articlesService = require("./articles.service");

class ArticlesController {
  async create(req, res, next) {
    try {
        const data = {
            ...req.body,
            user: req.user._id
        };
        const article = await articlesService.create(data);
        req.io.emit("article:create", article);
        res.status(201).json(article);
    } catch (err) {
        next(err);
    }
  }

  async update(req, res, next) {
    if(req.user.role === "admin"){
        try {
            const id = req.params.id;
            const data = req.body;
            const articleModified = await articlesService.update(id, data);
            if (!articleModified) {
                throw new NotFoundError();
            }
            res.json(articleModified);
        } catch (err) {
            next(err);
        }
    }else{
        res.status(403).json({ message: "Forbidden" });
    }
 }

  async delete(req, res, next) {
    if(req.user.role === "admin"){
        try {
                const id = req.params.id;
                await articlesService.delete(id);
                req.io.emit("article:delete", { id });
                res.status(204).send();
        } catch (err) {
            next(err);
        }
    }else{
        res.status(403).json({ message: "Forbidden" });
    }
 }
}

module.exports = new ArticlesController();
