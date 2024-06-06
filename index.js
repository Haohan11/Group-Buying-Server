import versionText from "./versionText.js";

import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import multer from "multer";
import dotenv from "dotenv";
import nodemailer from "nodemailer";

import { goHash } from "./model/helper.js";
import getUserPermission from "./controller/getUserPermission.js";

import { Routers } from "./routes.js";

const {
  SeriesRouter,
  EmployeeRouter,
  EnvironmentRouter,
  ColorSchemeRouter,
  MaterialRouter,
  DesignRouter,
  SupplierRouter,
  StockRouter,
  ColorNameRouter,
  CombinationRouter,
  AccountRouter,
  RoleRouter,
  PermissionRouter,
} = Routers;

import connectDbMiddleWare from "./middleware/connectDbMiddleware.js";
import responseMiddleware from "./middleware/responseMiddleware.js";
import authenticationMiddleware from "./middleware/authenticationMiddleware.js";
import authResetMiddleware from "./middleware/authResetMiddleware.js";
import addUserMiddleware from "./middleware/addUser.js";
import notFoundResponse from "./middleware/404reponse.js";
import establishAssociation from "./middleware/establishAssociation.js";
import staticPathName from "./model/staticPathName.js";

import connectToDataBase from "./model/connectToDatabase.js";
import Schemas from "./model/schema/schema.js";
import createSchema from "./model/createSchema.js";

dotenv.config();

const app = express();

app.use(cors());

app.use(express.static(staticPathName));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Add custom response method to res.response
app.use(responseMiddleware);

app.get("/version", async (req, res) =>
  res.response(200, `Current version: ${versionText}`)
);

app.post("/sendmail", multer().none(), async (req, res) => {
  const { UserSchema, MailAuthCodeSchema } = Schemas;

  const sequelize = await connectToDataBase();
  const User = createSchema(sequelize, UserSchema);
  const MailAuthCode = createSchema(sequelize, MailAuthCodeSchema);

  await sequelize.sync();

  const systemAuthor = {
    create_id: "system",
    create_name: "system",
    modify_id: "system",
    modify_name: "system",
  };

  const { email } = req.body;

  const result = await User.findOne({
    where: {
      account: email,
    },
  });

  if (result === null) return res.response(400, "NoEmail");

  const getAuthCode = async () => {
    const authCode = Math.floor(Math.random() * 9000 + 1000);
    const isExist = await MailAuthCode.findOne({
      attribute: ["id"],
      where: { auth_code: authCode, expire: false },
    });
    return isExist === null ? authCode : await getAuthCode();
  };

  const exp = (process.env.MAIL_EXPIRE_TIME ?? 600) * 1000;

  try {
    const auth_code = await getAuthCode();
    const { id } = await MailAuthCode.create({
      name: email,
      auth_code,
      expire_time: Date.now() + exp,
      email,
      ...systemAuthor,
    });
    const setExpire = async () =>
      await MailAuthCode.update(
        { expire: true, ...systemAuthor },
        { where: { id } }
      );

    const timerId = setTimeout(setExpire, exp);

    const mailOptions = {
      from: process.env.GMAIL_ACCOUNT,
      to: email,
      subject: "翔宇窗飾 - 重設密碼驗證碼",
      html: `
      <div>
        <div style="width: 50%; min-width: 550px; max-width: 650px; background: #efefef;padding: 25px; border-radius: 3px; color: #555; font-weight: bold; text-align: center;">
          <h2>您好，請使用以下驗證碼進行密碼重新設定</h2>
          <p>你的驗證碼</p>
          <div style="width: 50%; margin: auto; padding: 20px 100px; border-radius: 5px; margin-top: 10px; background: white; font-size: 34px">${auth_code}</div>
          <p>請於十分鐘內設定完成</p>
        </div>
      </div>`,
    };

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_ACCOUNT,
        pass: process.env.GMAIL_PASSWORD,
      },
    });

    await transporter.verify();

    transporter.sendMail(mailOptions, async (err, info) => {
      if (err) {
        clearTimeout(timerId);
        await setExpire();
        return res.response(500);
      }

      return res.response(200, "Success sent email.");
    });
  } catch (err) {
    console.log(err);
    return res.response(500);
  }
});

app.post("/authcodecheck", multer().none(), async (req, res) => {
  try {
    const { auth_code } = req.body;

    const { MailAuthCodeSchema } = Schemas;

    const sequelize = await connectToDataBase();
    const MailAuthCode = createSchema(sequelize, MailAuthCodeSchema);

    await sequelize.sync();

    const emailData = await MailAuthCode.findOne({
      attribute: ["email"],
      where: {
        auth_code,
        expire: false,
      },
    });

    if (emailData === null) return res.response(403, "WrongAuthCode");

    const payload = {
      user_account: emailData.email,
    };
    const exp =
      Math.floor(Date.now() / 1000) +
      (parseInt(process.env.MAIL_EXPIRE_TIME) || 600);
    const token = jwt.sign({ payload, exp }, "reset_secret_key");

    res.response(200, {
      email: emailData.email,
      token: token,
      auth_code: auth_code,
      token_type: "bearer",
      _exp: exp,
    });
  } catch (error) {
    console.log(error);
    res.response(500, { error });
  }
});

// Add connection to res.app
app.use(connectDbMiddleWare);

app.get("/alter-tables", async (req, res) => {
  try {
    const { sequelize } = req.app;
    Object.entries(Schemas).forEach(
      ([name, schema]) => !name.includes("_") && createSchema(sequelize, schema)
    );
    await sequelize.sync({ alter: true });
    res.response(200);
  } catch {
    res.response(500);
  }
});

app.use(establishAssociation);

app.post("/login-front", async function (req, res) {
  try {
    const { account, password } = req.body;

    const { user: User, employee: Employee } = req.app.sequelize.models;

    const user = await User.findOne({
      where: {
        account,
      },
    });

    if (!user) return res.response(404, "帳號錯誤");

    // check employee enable
    const employee = await Employee.findOne({
      where: {
        user_id: user.id,
        enable: true,
      },
    });

    if (!employee && account !== "admin")
      return res.response(401, "Not enable.");

    const isPasswordCorrect = bcrypt.compareSync(password, user.password);
    if (!isPasswordCorrect) return res.response(403, "密碼錯誤");

    const permission = await getUserPermission(req, user);
    if (permission === false) return res.response(500);
    if (permission === "NoPermission") return res.response(401, "NoPermission");
    if (!permission.front?.modify && !permission.front?.view)
      return res.response(401, "NoPermission");

    const payload = {
      user_account: account,
      user_password: password,
    };
    const exp =
      Math.floor(Date.now() / 1000) +
      (parseInt(process.env.EXPIRE_TIME) || 3600);
    const token = jwt.sign({ payload, exp }, "front_secret_key");

    res.response(200, {
      id: user.id,
      name: user.name,
      token: token,
      token_type: "bearer",
      permission,
      _exp: exp,
    });
  } catch (error) {
    console.log(error);
    res.response(500, { error });
  }
});

app.post("/login", async function (req, res) {
  try {
    const { account, password } = req.body;

    const { user: User, employee: Employee } = req.app.sequelize.models;

    const user = await User.findOne({
      where: {
        account,
      },
    });

    if (!user) return res.response(404, "帳號錯誤");

    // check employee enable
    const employee = await Employee.findOne({
      where: {
        user_id: user.id,
        enable: true,
      },
    });
    
    if (!employee && account !== "admin")
      return res.response(401, "Not enable.");

    const isPasswordCorrect = bcrypt.compareSync(password, user.password);
    if (!isPasswordCorrect) return res.response(403, "密碼錯誤");

    const permission = await getUserPermission(req, user);
    if (permission === false) return res.response(500);
    if (permission === "NoPermission") return res.response(401, "NoPermission");
    if (
      !permission.back?.modify &&
      !permission.back?.view &&
      !permission.stock?.modify &&
      !permission.stock?.view &&
      !permission.environment?.modify &&
      !permission.environment?.view &&
      !permission.account?.modify &&
      !permission.account?.view
    )
      return res.response(401, "NoPermission");

    const payload = {
      user_account: account,
      user_password: password,
    };
    const exp =
      Math.floor(Date.now() / 1000) +
      (parseInt(process.env.EXPIRE_TIME) || 3600);
    const token = jwt.sign({ payload, exp }, "my_secret_key");

    res.response(200, {
      id: user.id,
      name: user.name,
      token: token,
      token_type: "bearer",
      permission,
      _exp: exp,
    });
  } catch (error) {
    console.log(error);
    res.response(500, { error });
  }
});

app.post(
  "/resetpassword",
  multer().none(),
  authResetMiddleware,
  addUserMiddleware,
  async (req, res) => {
    const { user: User, employee: Employee } = req.app.sequelize.models;
    const { user_account } = req._user;
    const password = req.body.password;

    const hashedPassword = await goHash(password);
    await User.update(
      { password: hashedPassword, ...req._user },
      {
        where: {
          account: user_account,
        },
      }
    );

    await Employee.update(
      { password: hashedPassword, ...req._user },
      {
        where: {
          email: user_account,
        },
      }
    );

    res.response(200, "Success change password.");
  }
);

app.post("/check-email", multer().none(), async (req, res) => {
  try {
    const { user: User } = req.app.sequelize.models;
    const result = await User.findOne({
      where: {
        account: req.body.email,
      },
    });
    return res.response(200, { exist: !!result });
  } catch (error) {
    console.log(error);
    return res.response(500);
  }
});

// jwt token authentication
app.use(authenticationMiddleware);

app.use(addUserMiddleware);

app.use("/employee", EmployeeRouter);
app.use("/series", SeriesRouter);
app.use("/environment", EnvironmentRouter);
app.use("/color-scheme", ColorSchemeRouter);
app.use("/material", MaterialRouter);
app.use("/design", DesignRouter);
app.use("/supplier", SupplierRouter);
app.use("/stock", StockRouter);
app.use("/color-name", ColorNameRouter);
app.use("/combination", CombinationRouter);
app.use("/account", AccountRouter);
app.use("/role", RoleRouter);
app.use("/permission", PermissionRouter);

app.post("/logout", async function (req, res) {
  try {
    res.response(200, "登出成功");
  } catch (error) {
    console.log(error);
    res.response(500, { error });
  }
});

app.get("/", (req, res) => {
  res.response(200, "Hello world");
});

app.use("*", notFoundResponse);

const port = 3005;
app.listen(port, () => console.log(`server run at ${port}`));
