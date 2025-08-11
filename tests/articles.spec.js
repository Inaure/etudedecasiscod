const request = require("supertest");
const { app } = require("../server");
const jwt = require("jsonwebtoken");
const config = require("../config");
const mockingoose = require("mockingoose");
const Article = require("../api/articles/articles.schema");
const User = require("../api/users/users.model");

describe("tester API articles", () => {
  let token;
  const USER_ID = "602d2149e773f2a3990b47f5"; // Id MongoDB valide

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
    token = jwt.sign({ userId: USER_ID }, config.secretJwtToken);

    // Mock du User pour le middleware
    mockingoose(User).toReturn(MOCK_USER_DOC, "findOne");

    // Mock création article
    mockingoose(Article).toReturn(
      { _id: "602d2149e773f2a3990b47f5", ...MOCK_ARTICLE },
      "save"
    );
  });

  test("[Articles] Create Article", async () => {
    const res = await request(app)
      .post("/api/articles")
      .send({
        title: MOCK_ARTICLE.title,
        content: MOCK_ARTICLE.content,
      })
      .set("x-access-token", token);

    console.log("Response body:", res.body);

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
    // Mock pour findOneAndUpdate
    mockingoose(Article).toReturn(
      {
        _id: "602d2149e773f2a3990b47f5",
        title: MOCK_ARTICLE.title,
        content: UPDATED_CONTENT,
        user: USER_ID, // renvoyer juste l'id (mongoose peuplera)
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
    const res = await request(app)
      .put("/api/articles/602d2149e773f2a3990b47f5")
      .send({
        content: UPDATED_CONTENT,
      })
      .set("x-access-token", token); // token admin

    expect(res.status).toBe(200);
    expect(res.body.content).toBe(UPDATED_CONTENT);

    expect(typeof res.body.user._id).toBe("string");
    expect(res.body.user).toHaveProperty("name", MOCK_USER_DOC.name);
    expect(res.body.user).toHaveProperty("email", MOCK_USER_DOC.email);
    expect(res.body.user).not.toHaveProperty("password");
  });

  test("Doit refuser la mise à jour si utilisateur non admin", async () => {
    // Token user simple sans rôle admin
    const userToken = jwt.sign(
      { userId: USER_ID, role: "user" },
      config.secretJwtToken
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


  afterEach(() => {
    mockingoose.resetAll();
  });
});
