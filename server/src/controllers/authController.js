// FILE: controllers/authController.js
// Responsibility: login, logout, current user. Requirements: AUTH-01, AUTH-04, AUTH-08, AUTH-11, AUTH-12, AUTH-13.
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { User } from "../models/User.js";

// A throwaway hash so "unknown email" takes about as long as "wrong password" (avoids revealing which emails exist).
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 10);

export async function login(req, res, next) {
  try {
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = typeof req.body.password === "string" ? req.body.password : "";
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // passwordHash is hidden by default (select:false), so we ask for it explicitly here only.
    const user = await User.findOne({ email }).select("+passwordHash");

    // bcrypt.compare hashes the typed password and compares it with the stored hash. Plaintext is never stored.
    const passwordMatches = await bcrypt.compare(password, user ? user.passwordHash : DUMMY_HASH);
    if (!user || !passwordMatches) {
      // Same message for both cases so attackers cannot discover valid emails.
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Sign a JWT. The payload holds only the user id. Expiry comes from JWT_EXPIRES_IN (default 1 hour).
    const token = jwt.sign({ id: user._id.toString() }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });

    // We return a safe user object (no passwordHash).
    res.status(200).json({
      token,
      user: { id: user._id.toString(), name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
}

// JWTs are stateless, so the server has nothing to delete. The real logout work happens in the browser:
// it throws the token away and disconnects the socket. We keep an endpoint so the client has one clear logout call.
export function logout(req, res) {
  res.status(200).json({ message: "Logged out" });
}

// Returns the identity of whoever owns the (already verified) token. Used by the frontend on page load.
export function me(req, res) {
  res.status(200).json({ user: req.user });
}
