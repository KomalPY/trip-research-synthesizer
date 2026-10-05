// Minimal Upstash Redis REST client (no dependencies). Works with the variables the Upstash
// integration on the Vercel Marketplace injects, or with the plain Upstash ones.

export function redisConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || "";
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || "";
  return url && token ? { url: url.replace(/\/$/, ""), token } : null;
}

// Runs several commands in one round trip; returns each command's result in order.
export async function pipeline(commands) {
  const cfg = redisConfig();
  if (!cfg) throw Object.assign(new Error("not configured"), { code: "not_configured" });
  const r = await fetch(cfg.url + "/pipeline", {
    method: "POST",
    headers: { authorization: "Bearer " + cfg.token, "content-type": "application/json" },
    body: JSON.stringify(commands),
  });
  if (!r.ok) throw new Error("redis " + r.status);
  const out = await r.json();
  return out.map((o) => {
    if (o.error) throw new Error("redis: " + o.error);
    return o.result;
  });
}
