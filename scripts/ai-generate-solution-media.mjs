/**
 * Military-grade text-to-video + text-to-image for Circuitbull solutions/products.
 *
 * Persona: Circuitbull® factory owner (Made in USA) — mission capability, not consumer ads.
 *
 * Preferred models (from video-ai.txt / text-to-image.txt):
 *   - Video: alibaba/wan-3.0-prime  (AI Gateway; needs gateway balance)
 *   - Image: black-forest-labs/flux-2-max (AI Gateway; needs gateway balance)
 * Fallbacks (Workers AI REST / neurons):
 *   - Image: @cf/black-forest-labs/flux-2-klein-9b
 *
 * Usage:
 *   node scripts/ai-generate-solution-media.mjs
 *   node scripts/ai-generate-solution-media.mjs --need=border-control
 *   node scripts/ai-generate-solution-media.mjs --skip-video
 *   node scripts/ai-generate-solution-media.mjs --skip-image
 */
import "dotenv/config";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "fs";
import { join } from "path";
import { spawnSync } from "child_process";
import { MongoClient } from "mongodb";
import { r2Put } from "./lib/r2.mjs";
import {
  allocateProductMediaSlug,
  productAiHeroKey,
  solutionImageKey,
  solutionVideoKey,
  toCdnUrl,
} from "./lib/cdn-paths.mjs";

const ACCOUNT = process.env.CF_AI_ACCOUNT_ID || process.env.CF_ACCOUNT_ID;
const VIDEO_TOKEN = process.env.CF_VIDEO_AI_TOKEN;
const IMAGE_TOKEN = process.env.CF_IMAGE_AI_TOKEN || process.env.CF_AI_API_TOKEN;
const VIDEO_MODEL = process.env.CF_VIDEO_AI_MODEL || "alibaba/wan-3.0-prime";
const IMAGE_MODEL = process.env.CF_IMAGE_AI_MODEL || "black-forest-labs/flux-2-max";
const IMAGE_FALLBACK = process.env.CF_IMAGE_AI_FALLBACK || "@cf/black-forest-labs/flux-2-klein-9b";
const GATEWAY = process.env.CF_AI_GATEWAY_ID || "default";
const OUT_DIR = join(process.cwd(), ".tmp", "ai-media");

const args = new Set(process.argv.slice(2));
const needSlug =
  (process.argv.find((a) => a.startsWith("--need=")) || "--need=border-control").split("=")[1] ||
  "border-control";
const skipVideo = args.has("--skip-video");
const skipImage = args.has("--skip-image");

const PERSONA = `You are the owner of a military-grade product manufacturing factory (Circuitbull®, Made in USA). You want to professionally introduce your products and solutions. Emphasize mission capability, not consumer ads.`;

function argVal(flag, fallback) {
  const hit = process.argv.find((a) => a.startsWith(`${flag}=`));
  return hit ? hit.split("=").slice(1).join("=") : fallback;
}

function factLines(product, limit = 14) {
  const lines = [];
  const specs = product.specs && typeof product.specs === "object" ? product.specs : null;
  if (specs) {
    for (const [k, v] of Object.entries(specs)) {
      if (v == null || String(v).trim() === "") continue;
      lines.push(`${k}: ${String(v).replace(/\s+/g, " ").trim()}`);
      if (lines.length >= limit) return lines;
    }
  }
  for (const f of product.facts || []) {
    const label = f.i18n?.en?.label || f.propertyKey || "spec";
    const value = f.i18n?.en?.value || f.value;
    if (!value) continue;
    lines.push(`${label}: ${String(value).replace(/\s+/g, " ").trim()}`);
    if (lines.length >= limit) break;
  }
  return lines;
}

function scoreProduct(p) {
  const blob = JSON.stringify(p).toLowerCase();
  let score = 0;
  for (const k of [
    "laser",
    "lrf",
    "range-finder",
    "rangefinder",
    "designat",
    "radar",
    "uav",
    "ptz",
    "thermal",
    "detection",
    "ip66",
  ]) {
    if (blob.includes(k)) score += 1;
  }
  return score;
}

function buildPrompts({ need, product }) {
  const title = need.i18n?.en?.title || need.slug;
  const problem = need.i18n?.en?.problem || "";
  const name = product.i18n?.en?.name || product.name || product.model || product.slug;
  const model = product.model || "";
  const specs = factLines(product).join("; ");

  const solutionVideo = [
    PERSONA,
    `Produce a cinematic HD text-to-video for Circuitbull® solution "${title}".`,
    `Operational need: ${problem}`,
    `Featured platform: ${name} (${model}).`,
    `Key specs to visualize: ${specs}.`,
    `Scene: military field / arid border corridor at dusk; vehicle-mounted thermal EO/IR PTZ with optional laser range-finder marking a distant UAV; target-lock reticle; radar-linked tracking HUD; thermal white-hot overlay moments; professional mission-systems atmosphere.`,
    `Palette vibe (subtle): sand #F4F3EF, olive/khaki #4B5320, coyote accent #D96B27. No consumer advertising, no logos as stickers, no blood, no graphic violence.`,
    `Camera: slow cinematic push-in and gentle pan, HD, military-grade documentary realism.`,
  ].join("\n");

  const solutionImage = [
    PERSONA,
    `Hero still for Circuitbull® solution "${title}" — Made in USA mission systems.`,
    `Need: ${problem}`,
    `Show a vehicle-mounted thermal / EO-IR PTZ platform on an arid frontier at dusk with subtle thermal HUD / target-lock atmosphere.`,
    `Specs atmosphere: ${specs}.`,
    `Cinematic military photography, sand/khaki/coyote palette, no consumer ad look, no text overlays.`,
  ].join("\n");

  const productImage = [
    PERSONA,
    `Tactical product still for Circuitbull® platform ${name} (${model}).`,
    `Emphasize rugged PTZ housing, thermal + visible optics windows, outdoor border / vehicle-mount context.`,
    `Specs: ${specs}.`,
    `Military-grade product photography, coyote/olive sand atmosphere, HD, no catalog watermarks, no text.`,
  ].join("\n");

  return { solutionVideo, solutionImage, productImage };
}

async function runGatewayCompat(token, model, body) {
  const url = `https://gateway.ai.cloudflare.com/v1/${ACCOUNT}/${GATEWAY}/compat/chat/completions`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "cf-aig-authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: `workers-ai/${model}`, ...body }),
  });
  const ct = res.headers.get("content-type") || "";
  const buf = Buffer.from(await res.arrayBuffer());
  if (!res.ok || buf[0] === 0x7b) {
    let err;
    try {
      err = JSON.parse(buf.toString("utf8"));
    } catch {
      err = { raw: buf.toString("utf8").slice(0, 400) };
    }
    const msg =
      err?.error?.[0]?.message ||
      err?.errors?.[0]?.message ||
      err?.message ||
      `HTTP ${res.status}`;
    const e = new Error(String(msg));
    e.status = res.status;
    e.payload = err;
    throw e;
  }
  return { buf, contentType: ct || "application/octet-stream" };
}

async function runImageRest(token, model, prompt) {
  // flux-2 family often requires multipart; flux-1-schnell accepts JSON
  const url = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT}/ai/run/${model}`;
  const form = new FormData();
  form.append("prompt", prompt);
  let res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  let ct = res.headers.get("content-type") || "";
  let buf = Buffer.from(await res.arrayBuffer());

  if (!res.ok && ct.includes("json")) {
    // retry JSON for models that accept it
    res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });
    ct = res.headers.get("content-type") || "";
    buf = Buffer.from(await res.arrayBuffer());
  }

  if (ct.includes("json") || buf[0] === 0x7b) {
    const json = JSON.parse(buf.toString("utf8"));
    if (!res.ok || json.success === false) {
      const msg = json?.errors?.[0]?.message || json?.error || `HTTP ${res.status}`;
      throw new Error(String(msg));
    }
    const b64 = json?.result?.image;
    if (!b64) throw new Error(`no image in response: ${JSON.stringify(json).slice(0, 200)}`);
    return Buffer.from(b64, "base64");
  }
  if (!res.ok) throw new Error(`image HTTP ${res.status}`);
  return buf;
}

async function generateVideo(prompt) {
  if (!VIDEO_TOKEN) throw new Error("CF_VIDEO_AI_TOKEN missing");
  console.log("video: trying", VIDEO_MODEL, "via AI Gateway…");
  try {
    const { buf, contentType } = await runGatewayCompat(VIDEO_TOKEN, VIDEO_MODEL, {
      prompt,
      resolution: argVal("--resolution", "720P"),
      ratio: "16:9",
      duration: Number(argVal("--duration", "5")),
    });
    const ext = contentType.includes("webm") ? "webm" : "mp4";
    return { buf, ext, model: VIDEO_MODEL, mode: "gateway-compat" };
  } catch (e) {
    console.warn("video preferred model failed:", e.message);
    throw e;
  }
}

/** Interim cinematic MP4 from a still when Wan is blocked by AI Gateway balance. */
function cinematicStillMotion(jpgPath) {
  let ffmpegBin = null;
  try {
    const mod = spawnSync("node", ["-e", "import('@ffmpeg-installer/ffmpeg').then(m=>process.stdout.write(m.default.path||m.path))"], {
      encoding: "utf8",
      cwd: process.cwd(),
    });
    if (mod.status === 0 && mod.stdout?.trim()) ffmpegBin = mod.stdout.trim();
  } catch {
    /* ignore */
  }
  if (!ffmpegBin) {
    const which = spawnSync("which", ["ffmpeg"], { encoding: "utf8" });
    if (which.status === 0) ffmpegBin = which.stdout.trim();
  }
  if (!ffmpegBin) throw new Error("ffmpeg not available for still-motion fallback");

  const out = join(OUT_DIR, "still-motion.mp4");
  const r = spawnSync(
    ffmpegBin,
    [
      "-y",
      "-loop",
      "1",
      "-i",
      jpgPath,
      "-vf",
      "scale=1600:900:force_original_aspect_ratio=increase,crop=1600:900,zoompan=z='min(zoom+0.0008,1.18)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=150:s=1280x720:fps=25",
      "-t",
      "6",
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      out,
    ],
    { encoding: "utf8" }
  );
  if (r.status !== 0) throw new Error(r.stderr?.slice(-400) || "ffmpeg still-motion failed");
  return {
    buf: readFileSync(out),
    ext: "mp4",
    model: "cinematic-still-motion",
    mode: "ffmpeg-zoompan-from-flux-still",
  };
}

async function generateImage(prompt, label) {
  if (!IMAGE_TOKEN) throw new Error("CF_IMAGE_AI_TOKEN / CF_AI_API_TOKEN missing");

  // Preferred flux-2-max via gateway
  try {
    console.log(`image[${label}]: trying`, IMAGE_MODEL, "via AI Gateway…");
    const { buf } = await runGatewayCompat(IMAGE_TOKEN, IMAGE_MODEL, { prompt });
    return { buf, model: IMAGE_MODEL, mode: "gateway-compat" };
  } catch (e) {
    console.warn(`image[${label}] preferred failed:`, e.message);
  }

  console.log(`image[${label}]: fallback`, IMAGE_FALLBACK);
  const buf = await runImageRest(IMAGE_TOKEN, IMAGE_FALLBACK, prompt);
  return { buf, model: IMAGE_FALLBACK, mode: "workers-ai-rest" };
}

function productNumericId(product) {
  const fromId = String(product._id || "").replace(/^product:/, "");
  if (/^\d+$/.test(fromId)) return fromId;
  const m = String(product.slug || "").match(/(\d{6,})$/);
  return m ? m[1] : product.slug || "unknown";
}

async function main() {
  if (!ACCOUNT) throw new Error("CF_ACCOUNT_ID / CF_AI_ACCOUNT_ID missing");
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI missing");
  mkdirSync(OUT_DIR, { recursive: true });

  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db(process.env.MONGODB_DB || "circuitbull");

  const need = await db.collection("needs").findOne({ slug: needSlug });
  if (!need) throw new Error(`need not found: ${needSlug}`);

  const products = await db.collection("products").find({ needSlugs: needSlug }).toArray();
  if (!products.length) throw new Error(`no products for need ${needSlug}`);
  products.sort((a, b) => scoreProduct(b) - scoreProduct(a));
  const product = products[0];
  const productId = productNumericId(product);
  const mediaSlug =
    product.cdn?.slug || allocateProductMediaSlug(product, new Set());
  const prompts = buildPrompts({ need, product });

  console.log(
    JSON.stringify(
      {
        need: need.slug,
        product: {
          id: productId,
          slug: product.slug,
          mediaSlug,
          model: product.model,
          score: scoreProduct(product),
        },
        models: { video: VIDEO_MODEL, image: IMAGE_MODEL, imageFallback: IMAGE_FALLBACK },
      },
      null,
      2
    )
  );

  const generatedAt = new Date().toISOString();
  const media = {
    video: null,
    image: null,
    poster: null,
    productImage: null,
    prompt: {
      video: prompts.solutionVideo,
      solutionImage: prompts.solutionImage,
      productImage: prompts.productImage,
    },
    models: {},
    generatedAt,
  };

  // --- Images ---
  if (!skipImage) {
    const solImg = await generateImage(prompts.solutionImage, "solution");
    const solKey = solutionImageKey(needSlug, ".jpg");
    const solPath = join(OUT_DIR, `${needSlug}-hero.jpg`);
    writeFileSync(solPath, solImg.buf);
    await r2Put(solKey, solImg.buf, "image/jpeg");
    media.image = toCdnUrl(solKey);
    media.poster = media.image;
    media.models.solutionImage = { model: solImg.model, mode: solImg.mode };
    console.log("uploaded", media.image);

    const prodImg = await generateImage(prompts.productImage, "product");
    const prodKey = productAiHeroKey(mediaSlug, ".jpg");
    const prodPath = join(OUT_DIR, `${mediaSlug}-ai-hero.jpg`);
    writeFileSync(prodPath, prodImg.buf);
    await r2Put(prodKey, prodImg.buf, "image/jpeg");
    media.productImage = toCdnUrl(prodKey);
    media.models.productImage = { model: prodImg.model, mode: prodImg.mode };
    console.log("uploaded", media.productImage);

    await db.collection("products").updateOne(
      { _id: product._id },
      {
        $set: {
          "media.aiHero": media.productImage,
          "media.poster": media.productImage,
          "media.prompt": prompts.productImage,
          "media.model": prodImg.model,
          "media.generatedAt": generatedAt,
          updatedAt: new Date(),
        },
      }
    );
  }

  // --- Video ---
  let videoError = null;
  if (!skipVideo) {
    try {
      const vid = await generateVideo(prompts.solutionVideo);
      const key = solutionVideoKey(needSlug, `.${vid.ext}`);
      const path = join(OUT_DIR, `${needSlug}-hero.${vid.ext}`);
      writeFileSync(path, vid.buf);
      await r2Put(key, vid.buf, vid.ext === "webm" ? "video/webm" : "video/mp4");
      media.video = toCdnUrl(key);
      media.models.video = { model: vid.model, mode: vid.mode };
      console.log("uploaded", media.video);
    } catch (e) {
      videoError = e.message;
      console.error("VIDEO_GENERATION_FAILED:", videoError);
      const still = join(OUT_DIR, `${needSlug}-hero.jpg`);
      if (existsSync(still) && !args.has("--no-still-motion")) {
        console.warn("Using cinematic still-motion fallback from solution hero still…");
        try {
          const vid = cinematicStillMotion(still);
          const key = solutionVideoKey(needSlug, `.${vid.ext}`);
          writeFileSync(join(OUT_DIR, `${needSlug}-hero.${vid.ext}`), vid.buf);
          await r2Put(key, vid.buf, "video/mp4");
          media.video = toCdnUrl(key);
          media.models.video = {
            model: vid.model,
            mode: vid.mode,
            preferredModel: VIDEO_MODEL,
            note: `Interim until AI Gateway credits unlock ${VIDEO_MODEL}`,
            preferredError: videoError,
          };
          videoError = null;
          console.log("uploaded", media.video);
        } catch (fe) {
          console.error("still-motion fallback failed:", fe.message);
          console.error(
            "Action: add AI Gateway credits (Cloudflare dashboard → AI Gateway → default → Add funds), then re-run."
          );
        }
      } else {
        console.error(
          "Action: add AI Gateway credits (Cloudflare dashboard → AI Gateway → default → Add funds), then re-run without --skip-video."
        );
      }
    }
  }

  await db.collection("needs").updateOne(
    { slug: needSlug },
    {
      $set: {
        media: {
          video: media.video,
          image: media.image,
          poster: media.poster || media.image,
          prompt: prompts.solutionVideo,
          imagePrompt: prompts.solutionImage,
          models: media.models,
          generatedAt,
          videoError: videoError || null,
        },
        updatedAt: new Date(),
      },
    }
  );

  // Also stamp featured investment for border-control if present
  await db.collection("investments").updateMany(
    { needSlugs: needSlug },
    {
      $set: {
        "media.video": media.video,
        "media.image": media.image,
        "media.poster": media.poster || media.image,
        "media.generatedAt": generatedAt,
        updatedAt: new Date(),
      },
    }
  );

  const report = {
    needSlug,
    productId,
    productSlug: product.slug,
    mediaSlug,
    media,
    videoError,
    limitations: {
      videoModel: `${VIDEO_MODEL}: resolution 480P|720P, ratio adaptive|16:9|…, duration ~5s; billed via AI Gateway wholesale`,
      imageModel: `${IMAGE_MODEL}: gateway wholesale; fallback ${IMAGE_FALLBACK} via Workers AI REST`,
    },
    homepage: "https://circuitbull.com/#solutions-media",
    localDir: OUT_DIR,
  };
  writeFileSync(join(OUT_DIR, "report.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  await client.close();

  if (videoError && !media.video) process.exitCode = 2;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
