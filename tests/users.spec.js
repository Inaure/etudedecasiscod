const request = require("supertest");
const { app } = require("../server");
const jwt = require("jsonwebtoken");
const config = require("../config");
const mockingoose = require("mockingoose");
const User = require("../api/users/users.model");
const usersService = require("../api/users/users.service");

describe("tester API users", () => {
  let token;
  const USER_ID = "fake";
  const MOCK_USER_DOC = {
    _id: USER_ID,
    name: "ana",
    email: "nfegeg@gmail.com",
    password: "azertyuiop",

    toObject() {
      const obj = { ...this };
      delete obj.password;
      return obj;
    },
  };

  const MOCK_DATA_CREATED = {
    name: "test",
    email: "test@test.net",
    password: "azertyuiop",
  };

  beforeEach(() => {
    token = jwt.sign({ userId: USER_ID }, config.secretJwtToken);
    mockingoose(User).toReturn(MOCK_USER_DOC, "findOne");
    mockingoose(User).toReturn([MOCK_USER_DOC], "find");
    mockingoose(User).toReturn(MOCK_DATA_CREATED, "save");
  });

  test("[Users] Get All", async () => {
    const res = await request(app)
      .get("/api/users")
      .set("x-access-token", token);

    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test("[Users] Create User", async () => {
    const res = await request(app)
      .post("/api/users")
      .send(MOCK_DATA_CREATED)
      .set("x-access-token", token);

    expect(res.status).toBe(201);
    expect(res.body.name).toBe(MOCK_DATA_CREATED.name);
  });

  test("Est-ce userService.getAll", async () => {
    const spy = jest
      .spyOn(usersService, "getAll")
      .mockImplementation(() => "test");

    await request(app)
      .get("/api/users")
      .set("x-access-token", token);

    expect(spy).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveReturnedWith("test");
  });

  afterEach(() => {
    jest.restoreAllMocks();
    mockingoose.resetAll();
  });
});
