import passport from "passport";
import local from "passport-local";
import GitHubStrategy from "passport-github2";
import { randomBytes } from "node:crypto";
import { UserModel } from "../dao/models/users.model.js";
import { userService, cartService } from "../utils/main.js";
import { isValidPassword } from "../utils/bcrypt.js";
import env from "./config.js";

export function initializePassport() {
  passport.use(
    "login",
    new local.Strategy(
      { usernameField: "email" },
      async (email, password, done) => {
        try {
          const user = await UserModel.findOne({
            email: email.trim().toLowerCase(),
          });
          return done(
            null,
            user && user.password && isValidPassword(password, user.password)
              ? user
              : false,
          );
        } catch (err) {
          return done(err);
        }
      },
    ),
  );
  passport.use(
    "register",
    new local.Strategy(
      { usernameField: "email", passReqToCallback: true },
      async (req, email, password, done) => {
        try {
          const { firstName, lastName, age } = req.body;
          const user = await userService.createOne({
            email: email.trim().toLowerCase(),
            password,
            firstName,
            lastName,
            age,
            rol: "user",
          });
          const cart = await cartService.createCart();
          user.cart = String(cart._id);
          user.last_connection = new Date();
          await user.save();
          return done(null, user);
        } catch (err) {
          return done(err);
        }
      },
    ),
  );
  if (env.githubClientId && env.githubClientSecret) {
    passport.use(
      "github",
      new GitHubStrategy(
        {
          clientID: env.githubClientId,
          clientSecret: env.githubClientSecret,
          callbackURL: env.apiUrl + "/sessions/githubcallback",
        },
        async (accessToken, _, profile, done) => {
          try {
            const response = await fetch("https://api.github.com/user/emails", {
              headers: {
                Accept: "application/vnd.github+json",
                Authorization: "Bearer " + accessToken,
              },
            });
            if (!response.ok) throw new Error("OAuth email lookup failed");
            const emails = await response.json();
            const email = emails.find(
              (item) => item.verified && item.primary,
            )?.email;
            if (!email) return done(null, false);
            let user = await UserModel.findOne({ email });
            if (!user) {
              user = await userService.createOne({
                email,
                firstName: profile.displayName || profile.username,
                password: randomBytes(32).toString("hex"),
                rol: "user",
              });
              user.cart = String((await cartService.createCart())._id);
              await user.save();
            }
            return done(null, user);
          } catch (err) {
            return done(err);
          }
        },
      ),
    );
  }
  passport.serializeUser((user, done) => done(null, String(user._id)));
  passport.deserializeUser(async (id, done) => {
    try {
      done(null, await UserModel.findById(id));
    } catch (err) {
      done(err);
    }
  });
}
