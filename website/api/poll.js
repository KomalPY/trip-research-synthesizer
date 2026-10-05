// Group poll & comment sync (skill S3). Deterministic: no model involved. Stores the shared
// comparison snapshot plus thumbs up/down votes and name-attributed comments in Upstash Redis,
// all with a short expiry that is refreshed on activity. GET ?share=ID reads; POST writes.
//   create  {snapshot}                         -> {share, ownerKey}
//   update  {share, ownerKey, snapshot}        -> {ok}
//   vote    {share, option, name, value}       -> poll state   (value: up | down | none)
//   comment {share, option, name, text}        -> poll state

import crypto from "node:crypto";
import { pipeline, redisConfig } from "./_redis.js";
import { clip } from "./_accommodation.js";

export const config = { maxDuration: 15 };

const TTL_SECONDS = 5 * 24 * 3600;
const SHARE = /^[A-Za-z0-9_-]{8,24}$/;
const OPTION = /^[a-z0-9-]{1,80}$/;
const MAX_SNAPSHOT_CHARS = 90000;
const MAX_VOTES = 600;
const MAX_COMMENTS = 300;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "";

const key = (share, part) => "stay:" + share + ":" + part;
const cleanName = (n) => clip(String(n || ""), 40).replace(/\|/g, "");
const touch = (share) => ["snap", "owner", "votes", "comments"].map((p) => ["EXPIRE", key(share, p), TTL_SECONDS]);

function optionIds(snapshot) {
  const ids = new Set();
  Object.values((snapshot && snapshot.results) || {}).forEach((r) => ((r && r.options) || []).forEach((o) => ids.add(o.id)));
  return ids;
}

async function readPoll(share) {
  const [snap, flat, comments] = await pipeline([
    ["GET", key(share, "snap")], ["HGETALL", key(share, "votes")], ["LRANGE", key(share, "comments"), 0, -1],
  ]);
  if (!snap) return null;
  const votes = {};
  const tally = {};
  for (let i = 0; i < (flat || []).length; i += 2) {
    const option = flat[i].split("|")[0];
    let v;
    try { v = JSON.parse(flat[i + 1]); } catch (e) { continue; }
    (votes[option] = votes[option] || []).push({ name: v.n, value: v.v });
    const t = (tally[option] = tally[option] || { up: 0, down: 0 });
    if (v.v === "up") t.up++; else if (v.v === "down") t.down++;
  }
  const parsed = (comments || []).map((c) => { try { return JSON.parse(c); } catch (e) { return null; } }).filter(Boolean);
  return { snapshot: JSON.parse(snap), votes, tally, comments: parsed.map((c) => ({ option: c.o, name: c.n, text: c.t, ts: c.ts })) };
}

export default async function handler(req, res) {
  if (ALLOWED_ORIGIN) res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  res.setHeader("Cache-Control", "no-store");
  if (ALLOWED_ORIGIN && req.method !== "GET" && req.headers.origin && req.headers.origin !== ALLOWED_ORIGIN) {
    return res.status(403).json({ error: "Origin not allowed" });
  }
  if (!redisConfig()) return res.status(501).json({ error: "Poll storage not configured" });

  try {
    if (req.method === "GET") {
      const share = String((req.query && req.query.share) || "");
      if (!SHARE.test(share)) return res.status(400).json({ error: "Invalid share link" });
      const poll = await readPoll(share);
      return poll ? res.status(200).json(poll) : res.status(404).json({ error: "This link has expired or doesn't exist" });
    }
    if (req.method !== "POST") return res.status(405).json({ error: "GET or POST only" });

    const b = req.body || {};
    if (b.action === "create") {
      const json = JSON.stringify(b.snapshot || null);
      if (!b.snapshot || typeof b.snapshot !== "object" || !b.snapshot.results || json.length > MAX_SNAPSHOT_CHARS) {
        return res.status(400).json({ error: "Invalid comparison" });
      }
      const share = crypto.randomBytes(9).toString("base64url");
      const ownerKey = crypto.randomBytes(16).toString("hex");
      await pipeline([["SET", key(share, "snap"), json, "EX", TTL_SECONDS], ["SET", key(share, "owner"), ownerKey, "EX", TTL_SECONDS]]);
      return res.status(200).json({ share, ownerKey });
    }

    if (!SHARE.test(String(b.share || ""))) return res.status(400).json({ error: "Invalid share link" });
    const share = b.share;

    if (b.action === "update") {
      const json = JSON.stringify(b.snapshot || null);
      if (!b.snapshot || !b.snapshot.results || json.length > MAX_SNAPSHOT_CHARS) return res.status(400).json({ error: "Invalid comparison" });
      const [stored] = await pipeline([["GET", key(share, "owner")]]);
      const a = Buffer.from(String(stored || ""));
      const c = Buffer.from(String(b.ownerKey || ""));
      if (!stored || a.length !== c.length || !crypto.timingSafeEqual(a, c)) return res.status(403).json({ error: "Not allowed" });
      await pipeline([["SET", key(share, "snap"), json, "EX", TTL_SECONDS], ...touch(share).slice(1)]);
      return res.status(200).json({ ok: true });
    }

    if (b.action === "vote" || b.action === "comment") {
      const name = cleanName(b.name);
      if (!name) return res.status(400).json({ error: "Add your name first" });
      if (!OPTION.test(String(b.option || ""))) return res.status(400).json({ error: "Invalid option" });
      const [snapRaw, votesLen, commentsLen] = await pipeline([
        ["GET", key(share, "snap")], ["HLEN", key(share, "votes")], ["LLEN", key(share, "comments")],
      ]);
      if (!snapRaw) return res.status(404).json({ error: "This link has expired or doesn't exist" });
      if (!optionIds(JSON.parse(snapRaw)).has(b.option)) return res.status(400).json({ error: "Unknown option" });

      if (b.action === "vote") {
        if (!["up", "down", "none"].includes(b.value)) return res.status(400).json({ error: "Invalid vote" });
        const field = b.option + "|" + name.toLowerCase();
        if (b.value === "none") await pipeline([["HDEL", key(share, "votes"), field]]);
        else {
          if (votesLen >= MAX_VOTES) return res.status(429).json({ error: "This poll is full" });
          await pipeline([["HSET", key(share, "votes"), field, JSON.stringify({ n: name, v: b.value })]]);
        }
      } else {
        const text = clip(String(b.text || ""), 500);
        if (!text) return res.status(400).json({ error: "Write a comment first" });
        if (commentsLen >= MAX_COMMENTS) return res.status(429).json({ error: "This poll is full" });
        await pipeline([["RPUSH", key(share, "comments"), JSON.stringify({ o: b.option, n: name, t: text, ts: Date.now() })]]);
      }
      await pipeline(touch(share));
      return res.status(200).json(await readPoll(share));
    }
    return res.status(400).json({ error: "Unknown action" });
  } catch (e) {
    return res.status(502).json({ error: "Storage unavailable" });
  }
}
