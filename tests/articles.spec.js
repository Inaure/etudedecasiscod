const request = require("supertest");
const { app } = require("../server");
const jwt = require("jsonwebtoken");
const config = require("../config");
const mockingoose = require("mockingoose");
const Article = require("../api/articles/articles.schema");
const User = require("../api/users/users.model");

describe("tester API articles", () => {
  let token;
  const USER_ID = "602d2149e773f2a3990b47f5";

  const MOCK_USER_DOC = {
    _id: USER_ID,
    name: "ana",
    email: "nfegeg@gmail.com",
    role: "admin",
    password: "azertyuiop",
    toObject() {
      const obj = { ...this };
      delete obj.password;
      return obj;
    },
  };

  const MOCK_ARTICLE = {
    title: "Un super article",
    content: "Le contenu de mon article.",
    user: MOCK_USER_DOC,
  };

  beforeEach(() => {
    token = jwt.sign({ userId: USER_ID, role: "admin" }, config.secretJwtToken);

    mockingoose(Article).toReturn(
      { _id: "602d2149e773f2a3990b47f5", ...MOCK_ARTICLE },
      "save"
    );
  });

  afterEach(() => {
    mockingoose.resetAll();
  });

  test("[Articles] Create Article", async () => {

    mockingoose(User).toReturn(MOCK_USER_DOC, "findOne");

    const res = await request(app)
      .post("/api/articles")
      .send({
        title: MOCK_ARTICLE.title,
        content: MOCK_ARTICLE.content,
      })
      .set("x-access-token", token);

    expect(res.status).toBe(201);
    expect(res.body.title).toBe(MOCK_ARTICLE.title);
    expect(res.body.content).toBe(MOCK_ARTICLE.content);

    expect(typeof res.body.user._id).toBe("string");
    expect(res.body.user._id.length).toBeGreaterThan(0);
    expect(res.body.user).toHaveProperty("name", MOCK_USER_DOC.name);
    expect(res.body.user).toHaveProperty("email", MOCK_USER_DOC.email);
    expect(res.body.user).not.toHaveProperty("password");
  });

  describe("[Articles] Update Article", () => {
    const UPDATED_CONTENT = "Contenu mis à jour";

    beforeEach(() => {
      mockingoose(Article).toReturn(
        {
          _id: "602d2149e773f2a3990b47f5",
          title: MOCK_ARTICLE.title,
          content: UPDATED_CONTENT,
          user: USER_ID, 
          populate(path) {
            if (path.path === "user") {
              this.user = MOCK_USER_DOC;
              return Promise.resolve(this);
            }
            return Promise.resolve(this);
          },
        },
        "findOneAndUpdate"
      );
    });

    test("Doit mettre à jour un article si utilisateur admin", async () => {
      mockingoose(User).toReturn(MOCK_USER_DOC, "findOne");

      const res = await request(app)
        .put("/api/articles/602d2149e773f2a3990b47f5")
        .send({
          content: UPDATED_CONTENT,
        })
        .set("x-access-token", token);

      expect(res.status).toBe(200);
      expect(res.body.content).toBe(UPDATED_CONTENT);

      expect(typeof res.body.user._id).toBe("string");
      expect(res.body.user).toHaveProperty("name", MOCK_USER_DOC.name);
      expect(res.body.user).toHaveProperty("email", MOCK_USER_DOC.email);
      expect(res.body.user).not.toHaveProperty("password");
    });

    test("Doit refuser la mise à jour si utilisateur non admin", async () => {
      const userToken = jwt.sign(
        { userId: USER_ID, role: "member" },
        config.secretJwtToken
      );

      mockingoose(User).toReturn(
        { ...MOCK_USER_DOC, role: "member" },
        "findOne"
      );

      const res = await request(app)
        .put("/api/articles/602d2149e773f2a3990b47f5")
        .send({
          content: UPDATED_CONTENT,
        })
        .set("x-access-token", userToken);

      expect(res.status).toBe(403);
      expect(res.body).toHaveProperty("message", "Forbidden");
    });
  });

  describe("[Articles] Delete Article", () => {
    beforeEach(() => {
      mockingoose(Article).toReturn(
        { _id: "602d2149e773f2a3990b47f5", ...MOCK_ARTICLE },
        "findOneAndDelete"
      );
    });

    test("Doit supprimer un article si utilisateur admin", async () => {
      mockingoose(User).toReturn(MOCK_USER_DOC, "findOne");

      const res = await request(app)
        .delete("/api/articles/602d2149e773f2a3990b47f5")
        .set("x-access-token", token);

      expect(res.status).toBe(204);
      expect(res.body).toEqual({});
    });

    test("Doit refuser la suppression si utilisateur non admin", async () => {
      const userToken = jwt.sign(
        { userId: USER_ID, role: "member" },
        config.secretJwtToken
      );

      mockingoose(User).toReturn(
        { ...MOCK_USER_DOC, role: "member" },
        "findOne"
      );

      const res = await request(app)
        .delete("/api/articles/602d2149e773f2a3990b47f5")
        .set("x-access-token", userToken);

      expect(res.status).toBe(403);
      expect(res.body).toHaveProperty("message", "Forbidden");
    });
  });
});
