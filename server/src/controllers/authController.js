// FILE: controllers/authController.js
// Responsibility: login, logout, current user. Requirements: AUTH-01, AUTH-04, AUTH-08, AUTH-11, AUTH-12, AUTH-13.
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { User } from "../models/User.js";
import { cleanText } from "../utils/validators.js";

// A throwaway hash so "unknown email" takes about as long as "wrong password" (avoids revealing which emails exist).
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 10);

// Sign a JWT. The payload holds only the user id. Expiry comes from JWT_EXPIRES_IN (default 1 hour).
function createToken(user) {
  return jwt.sign({ id: user._id.toString() }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
}

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

        const token = createToken(user);

    // We return a safe user object (no passwordHash).
    res.status(200).json({
      token,
      user: { id: user._id.toString(), name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/register - create a Customer or Support Agent account.
// Security: anyone may become a customer, but an AGENT needs the secret invite code from the server environment.
export async function register(req, res, next) {
  try {
    const name = cleanText(req.body.name, "Name", { min: 2, max: 60 });
    if (name.error) return res.status(400).json({ message: name.error });

    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
    if (email.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: "Enter a valid email address" });
    }

    // bcrypt only uses the first 72 bytes, so we cap the length at 72.
    const password = typeof req.body.password === "string" ? req.body.password : "";
    if (password.length < 8 || password.length > 72) {
      return res.status(400).json({ message: "Password must be 8 to 72 characters" });
    }

    // Only accept the two known roles.
    const role = req.body.role;
    if (role !== "customer" && role !== "agent") {
      return res.status(400).json({ message: "Role must be customer or agent" });
    }

    if (role === "agent") {
      if (!env.agentRegistrationCode) {
        return res.status(403).json({ message: "Support Agent registration is not enabled" });
      }
      if (req.body.agentCode !== env.agentRegistrationCode) {
        return res.status(403).json({ message: "Invalid agent registration code" });
      }
    }

    if (await User.findOne({ email })) {
      return res.status(409).json({ message: "An account with this email already exists" });
    }

    // Hash the password before saving. The plaintext password is never stored.
    const passwordHash = await bcrypt.hash(password, 10);
    let user;
    try {
      user = await User.create({ name: name.value, email, passwordHash, role });
    } catch (err) {
      // 11000 = unique index violation (two sign-ups with the same email at the same moment)
      if (err.code === 11000) return res.status(409).json({ message: "An account with this email already exists" });
      throw err;
    }

    // Log the new user in straight away (same response shape as login).
    res.status(201).json({
      token: createToken(user),
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
