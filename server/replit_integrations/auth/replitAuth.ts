import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import MemoryStore from "memorystore";

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const secret = process.env.SESSION_SECRET || "kairos-dev-secret-change-me";

  // Use in-memory session store to avoid startup DB connection issues
  // Sessions are valid until server restarts - acceptable for this app
  const MemStore = MemoryStore(session);
  return session({
    secret,
    store: new MemStore({ checkPeriod: sessionTtl }),
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: sessionTtl,
    },
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Simple username/password strategy
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const appUser = process.env.APP_USERNAME || "admin";
        const appPassword = process.env.APP_PASSWORD || "kairos2024";
        if (username === appUser && password === appPassword) {
          return done(null, {
            id: "admin",
            claims: { sub: "admin", email: process.env.APP_EMAIL || "admin@kairos.local" },
          });
        }
        return done(null, false, { message: "Credenziali non valide" });
      } catch (err) {
        return done(err);
      }
    })
  );

  passport.serializeUser((user: any, cb) => cb(null, user));
  passport.deserializeUser((user: any, cb) => cb(null, user));

  // Login via POST JSON
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: info?.message || "Credenziali non valide" });
      req.logIn(user, (err) => {
        if (err) return next(err);
        res.json({ ok: true, user });
      });
    })(req, res, next);
  });

  // Redirect GET /api/login to login page (for auth-guard.js compatibility)
  app.get("/api/login", (_req, res) => {
    res.redirect("/");
  });

  app.get("/api/callback", (_req, res) => {
    res.redirect("/dashboard.html");
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect("/");
    });
  });
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  return res.status(401).json({ message: "Unauthorized" });
};
