#!/usr/bin/env node
/**
 * deploy-portals.js
 * Deploys the Parris Multiverse portal system across all game repos.
 *
 * Usage:
 *   node deploy-portals.js
 *
 * Requirements:
 *   npm install node-fetch   (or Node 18+ has fetch built-in)
 *
 * Set your tokens in the TOKENS object below, then run.
 * After running, revoke and replace your tokens.
 */

// ── CONFIG ────────────────────────────────────────────────────────────────────

const TOKENS = {
  joshualparris:             process.env.GH_TOKEN_JOSHUALPARRIS,
  "joshuaparrisdadlan-stack": process.env.GH_TOKEN_JOSHUAPARRISDADLAN_STACK,
  "joshuaparris-max":         process.env.GH_TOKEN_JOSHUAPARRIS_MAX,
};

if (!TOKENS.joshualparris || !TOKENS["joshuaparrisdadlan-stack"] || !TOKENS["joshuaparris-max"]) {
  console.warn("Warning: one or more GitHub tokens are not set in the environment. Set GH_TOKEN_JOSHUALPARRIS, GH_TOKEN_JOSHUAPARRISDADLAN_STACK, and GH_TOKEN_JOSHUAPARRIS_MAX before running.");
}

const PORTAL_HTML_REPO  = "joshualparris/JoshHub";
const PORTAL_HTML_PATH  = "public/portal.html";
const PORTAL_ADAPTER_PATH = "public/portal-adapter.js";

const ADAPTER_URL = "https://josh-hub-96no.vercel.app/portal-adapter.js";

// Games to patch: each entry defines which repo, which HTML file, and the GAME_ID
const GAMES = [
  // ── joshuaparrisdadlan-stack repos ───────────────────────────────────────
  {
    account: "joshuaparrisdadlan-stack",
    repo: "whispering-wilds",
    htmlFile: "index.html",
    gameId: "whispering-wilds",
    portalTriggers: [
      // PyScript game — add portal room handler note in HTML comment + JS arrival detection
      { type: "arrival-only" }
    ],
  },
  {
    account: "joshuaparrisdadlan-stack",
    repo: "Null",
    htmlFile: "index.html",
    gameId: "null",
    portalTriggers: [{ type: "command-parser", commands: ["enter gate", "gate", "portal"] }],
  },
  {
    account: "joshuaparrisdadlan-stack",
    repo: "MysteriousDepths",
    htmlFile: "index.html",
    gameId: "mystery-depths",
    portalTriggers: [{ type: "arrival-only" }],
  },
  {
    account: "joshuaparrisdadlan-stack",
    repo: "OrgScape",
    htmlFile: "index.html",
    gameId: "infinite-office",
    portalTriggers: [{ type: "arrival-only" }],
  },
  {
    account: "joshuaparrisdadlan-stack",
    repo: "LetsPlayDnd",
    htmlFile: "index.html",
    gameId: "simple-rpg",
    portalTriggers: [{ type: "arrival-only" }],
  },

  // ── joshuaparris-max repos ────────────────────────────────────────────────
  {
    account: "joshuaparris-max",
    repo: "WhirringWilderness",
    htmlFile: "index.html",
    gameId: "whirring-wilderness",
    portalTriggers: [{ type: "arrival-only" }],
  },
  {
    account: "joshuaparris-max",
    repo: "Midnight-Line",
    htmlFile: "index.html",
    gameId: "midnight-line",
    portalTriggers: [{ type: "arrival-only" }],
  },
  {
    account: "joshuaparris-max",
    repo: "StarHaven",
    htmlFile: "index.html",
    gameId: "starhaven",
    portalTriggers: [{ type: "arrival-only" }],
  },

  // ── joshualparris repos ───────────────────────────────────────────────────
  {
    account: "joshualparris",
    repo: "wastes-courier-roguelike",
    htmlFile: "index.html",
    gameId: "wastes-courier",
    portalTriggers: [{ type: "arrival-only" }],
  },
];

// ── PORTAL FILE CONTENTS ──────────────────────────────────────────────────────

const PORTAL_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Portal — The Multiverse</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700&family=Crimson+Pro:ital,wght@0,300;0,400;1,300&display=swap');
  :root{--bg:#03020a;--accent:#7c5cfc;--accent2:#c084fc;--text:#e8e0ff;--dim:#7c72a8;--glow:rgba(124,92,252,0.4)}
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:100%;height:100%;background:var(--bg);color:var(--text);font-family:'Crimson Pro',Georgia,serif;overflow:hidden}
  .portal-wrap{position:fixed;inset:0;z-index:1;display:flex;align-items:center;justify-content:center}
  .vortex{position:relative;width:380px;height:380px}
  .ring{position:absolute;inset:0;border-radius:50%;animation:spin linear infinite}
  .ring-1{border:2px solid transparent;border-top-color:var(--accent);border-right-color:var(--accent);box-shadow:0 0 30px var(--glow),inset 0 0 30px var(--glow);animation-duration:3s}
  .ring-2{inset:20px;border:1px solid transparent;border-top-color:var(--accent2);border-left-color:var(--accent2);opacity:.7;animation-duration:2.2s;animation-direction:reverse}
  .ring-3{inset:40px;border:1px solid transparent;border-bottom-color:#a78bfa;border-right-color:#a78bfa;opacity:.5;animation-duration:4s}
  .ring-4{inset:60px;border:2px solid transparent;border-top-color:rgba(124,92,252,.4);animation-duration:1.8s;animation-direction:reverse}
  .portal-core{position:absolute;inset:80px;border-radius:50%;background:radial-gradient(circle at center,#1a0a3a 0%,#0d0520 40%,#03020a 100%);box-shadow:0 0 60px rgba(124,92,252,.3),0 0 120px rgba(124,92,252,.15),inset 0 0 40px rgba(124,92,252,.2);animation:pulse 3s ease-in-out infinite}
  .portal-symbol{position:absolute;inset:80px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:'Cinzel Decorative',serif;font-size:2.5rem;color:rgba(192,132,252,.6);animation:pulse 3s ease-in-out infinite;z-index:2}
  @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
  @keyframes pulse{0%,100%{opacity:.8;transform:scale(1)}50%{opacity:1;transform:scale(1.03)}}
  .content{position:fixed;inset:0;z-index:10;display:flex;flex-direction:column;align-items:center;justify-content:center;pointer-events:none}
  .from-label{font-style:italic;font-size:.95rem;color:var(--dim);letter-spacing:.15em;margin-bottom:1rem;opacity:0;animation:fadeUp .8s ease .3s forwards}
  .flavour{font-style:italic;font-size:1.4rem;color:var(--text);text-align:center;max-width:480px;line-height:1.7;padding:0 2rem;opacity:0;animation:fadeUp 1s ease .6s forwards;margin-top:230px}
  .destination-label{margin-top:2rem;font-family:'Cinzel Decorative',serif;font-size:1.1rem;color:var(--accent2);letter-spacing:.2em;text-transform:uppercase;opacity:0;animation:fadeUp .8s ease 1s forwards}
  .progress-wrap{margin-top:2rem;width:220px;height:2px;background:rgba(124,92,252,.15);border-radius:2px;overflow:hidden;opacity:0;animation:fadeUp .5s ease 1.2s forwards}
  .progress-bar{height:100%;width:0%;background:linear-gradient(90deg,var(--accent),var(--accent2));border-radius:2px;box-shadow:0 0 8px var(--glow);transition:width .1s linear}
  .skip-btn{margin-top:1.5rem;font-family:'Crimson Pro',serif;font-size:.85rem;color:var(--dim);letter-spacing:.1em;cursor:pointer;pointer-events:all;opacity:0;border:none;background:none;animation:fadeUp .5s ease 1.5s forwards;transition:color .2s}
  .skip-btn:hover{color:var(--text)}
  .whoosh{position:fixed;inset:0;z-index:100;background:radial-gradient(circle at center,var(--accent),var(--bg));opacity:0;pointer-events:none;transition:opacity .6s ease}
  .whoosh.active{opacity:1}
  @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
</style>
</head>
<body>
<div class="portal-wrap">
  <div class="vortex">
    <div class="ring ring-1"></div><div class="ring ring-2"></div>
    <div class="ring ring-3"></div><div class="ring ring-4"></div>
    <div class="portal-core"></div>
    <div class="portal-symbol">⬡</div>
  </div>
</div>
<div class="content">
  <div class="from-label" id="fromLabel">departing <span id="fromName">—</span></div>
  <div class="flavour" id="flavourText">The air shimmers. Reality folds.</div>
  <div class="destination-label" id="destName">Unknown Realm</div>
  <div class="progress-wrap"><div class="progress-bar" id="progressBar"></div></div>
  <button class="skip-btn" id="skipBtn">skip →</button>
</div>
<div class="whoosh" id="whoosh"></div>
<script>
const PORTALS={
  "whispering-wilds":{label:"Whispering Wilds",url:"https://joshuaparrisdadlan-stack.github.io/whispering-wilds/",portals:[{to:"null",flavour:"The forest exhales. The trees thin to wire. Silence arrives like a wall."},{to:"mystery-depths",flavour:"The roots descend. The soil becomes cold water. Something ancient stirs below."},{to:"infinite-office",flavour:"The break room window opens onto something green. You climb through the glass."}]},
  "null":{label:"Null",url:"https://joshuaparrisdadlan-stack.github.io/Null/",portals:[{to:"whispering-wilds",flavour:"The rope slackens. Green arrives. Noise."},{to:"infinite-office",flavour:"The rope becomes a lanyard. The silence becomes a hum. Fluorescent."},{to:"mystery-depths",flavour:"The beads are cold. Very cold. The ground is gone."}]},
  "mystery-depths":{label:"Mystery Depths",url:"https://joshuaparrisdadlan-stack.github.io/MysteriousDepths/",portals:[{to:"whispering-wilds",flavour:"The water drains upward. Roots. Leaves. Light."},{to:"wastes-courier",flavour:"The seabed cracks. Dust pours in. You are standing in a wasteland."},{to:"null",flavour:"There is no sound here. There never was."}]},
  "infinite-office":{label:"The Infinite Office",url:"https://joshuaparrisdadlan-stack.github.io/OrgScape/",portals:[{to:"null",flavour:"The fluorescents cut out. The lanyard becomes rope. The silence is total."},{to:"whispering-wilds",flavour:"The break room window opens onto something green. You climb through."}]},
  "wastes-courier":{label:"Wastes Courier",url:"https://joshualparris.github.io/wastes-courier-roguelike/",portals:[{to:"mystery-depths",flavour:"The parcel dissolves. Salt water. Dark. You delivered something to the bottom of the world."},{to:"whispering-wilds",flavour:"The wasteland softens. Green. The delivery was to a forest that shouldn't exist."}]},
  "simple-rpg":{label:"Simple RPG",url:"https://joshuaparrisdadlan-stack.github.io/LetsPlayDnd/",portals:[{to:"whispering-wilds",flavour:"The dungeon opens. Stone becomes bark. You are outside, in a living forest."}]},
  "midnight-line":{label:"The Midnight Line",url:"https://joshuaparris-max.github.io/Midnight-Line/",portals:[{to:"null",flavour:"The lights go out. The station disappears. Rope. Silence."},{to:"mystery-depths",flavour:"The platform descends. The train never surfaces."}]},
  "starhaven":{label:"Starhaven",url:"https://joshuaparris-max.github.io/StarHaven/",portals:[{to:"midnight-line",flavour:"The stars rearrange. You are on a train. It is very late."},{to:"mystery-depths",flavour:"The telescope points down instead of up. Below is ocean."}]},
  "whirring-wilderness":{label:"Whirring Wilderness",url:"https://joshuaparris-max.github.io/WhirringWilderness/",portals:[{to:"null",flavour:"The gears stop. The vines turn to rope. Silence."}]}
};
const URLS=Object.fromEntries(Object.entries(PORTALS).map(([k,v])=>[k,v.url]));
const LABELS=Object.fromEntries(Object.entries(PORTALS).map(([k,v])=>[k,v.label]));
const params=new URLSearchParams(window.location.search);
const from=params.get("from")||"";
const to=params.get("to")||"";
let flavour="Reality folds. The air shimmers. You pass through.";
if(PORTALS[from]){const m=PORTALS[from].portals.find(p=>p.to===to);if(m)flavour=m.flavour;}
const destUrl=URLS[to]||params.get("url")||null;
const destLabel=LABELS[to]||to.replace(/-/g," ")||"Unknown Realm";
const fromLabel=LABELS[from]||from.replace(/-/g," ")||"";
document.getElementById("flavourText").textContent=flavour;
document.getElementById("destName").textContent=destLabel;
document.getElementById("fromName").textContent=fromLabel;
if(!fromLabel)document.getElementById("fromLabel").style.display="none";
const bar=document.getElementById("progressBar");
const DELAY=4000;const start=Date.now();
function tick(){const pct=Math.min(100,((Date.now()-start)/DELAY)*100);bar.style.width=pct+"%";if(pct<100)requestAnimationFrame(tick);else doRedirect();}
requestAnimationFrame(tick);
function doRedirect(){if(!destUrl)return;const w=document.getElementById("whoosh");w.classList.add("active");setTimeout(()=>{window.location.href=destUrl+"?portal=true&from="+encodeURIComponent(to);},600);}
document.getElementById("skipBtn").addEventListener("click",doRedirect);
</script>
</body>
</html>`;

const PORTAL_ADAPTER_JS = `/* portal-adapter.js — Parris Multiverse v1.0 */
const PortalAdapter=(()=>{
  const HUB="https://josh-hub-96no.vercel.app/portal.html";
  const LABELS={"whispering-wilds":"Whispering Wilds","null":"Null","mystery-depths":"Mystery Depths","infinite-office":"The Infinite Office","wastes-courier":"Wastes Courier","simple-rpg":"Simple RPG","midnight-line":"The Midnight Line","starhaven":"Starhaven","whirring-wilderness":"Whirring Wilderness","dark-realms":"Dark Realms","classic-dnd":"Classic D&D","dnd-dungeon":"D&D RPG Dungeon"};
  let GAME_ID="unknown";
  function setGame(id){GAME_ID=id;}
  function checkArrival(){
    const p=new URLSearchParams(window.location.search);
    if(!p.get("portal"))return;
    const from=p.get("from")||"";
    const label=LABELS[from]||from.replace(/-/g," ")||"another world";
    showBanner(label);
    window.history.replaceState({},"",window.location.pathname+window.location.hash);
  }
  function showBanner(from){
    const el=document.createElement("div");el.id="portal-arrival";
    el.innerHTML=\`<span style="color:#7c5cfc">⬡</span> <span>You arrived from <em style="color:#c084fc;font-style:normal">\${from}</em></span> <button onclick="this.parentElement.remove()" style="background:none;border:none;color:rgba(124,92,252,.6);cursor:pointer;font-size:.8rem;margin-left:.5rem">✕</button>\`;
    Object.assign(el.style,{position:"fixed",top:"1rem",left:"50%",transform:"translateX(-50%)",zIndex:"9999",display:"flex",alignItems:"center",gap:".5rem",background:"rgba(10,5,25,0.92)",border:"1px solid rgba(124,92,252,0.5)",color:"#e8e0ff",fontFamily:"Georgia,serif",fontStyle:"italic",fontSize:".9rem",padding:".6rem 1rem",borderRadius:"4px",boxShadow:"0 0 20px rgba(124,92,252,.3)",maxWidth:"90vw"});
    document.body.appendChild(el);
    setTimeout(()=>el?.remove(),5000);
  }
  function trigger(dest){
    const url=\`\${HUB}?from=\${encodeURIComponent(GAME_ID)}&to=\${encodeURIComponent(dest)}\`;
    const flash=document.createElement("div");
    Object.assign(flash.style,{position:"fixed",inset:"0",zIndex:"99999",background:"radial-gradient(circle at center,#7c5cfc,#03020a)",opacity:"0",transition:"opacity .4s ease",pointerEvents:"none"});
    document.body.appendChild(flash);
    requestAnimationFrame(()=>{flash.style.opacity="1";setTimeout(()=>{window.location.href=url;},400);});
  }
  function renderLink(dest,container){
    const label=LABELS[dest]||dest.replace(/-/g," ");
    const btn=document.createElement("button");
    btn.innerHTML=\`⬡ Portal to <em style="color:#e8e0ff;font-style:normal">\${label}</em>\`;
    Object.assign(btn.style,{display:"inline-flex",alignItems:"center",gap:".4rem",background:"rgba(10,5,25,0.8)",border:"1px solid rgba(124,92,252,0.4)",color:"#c084fc",fontFamily:"Georgia,serif",fontStyle:"italic",fontSize:".9rem",padding:".5rem 1rem",borderRadius:"3px",cursor:"pointer",margin:".25rem"});
    btn.onclick=()=>trigger(dest);
    container?.appendChild(btn);
    return btn;
  }
  function init(gameId){
    if(gameId)GAME_ID=gameId;
    if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",checkArrival);
    else checkArrival();
  }
  return{init,trigger,renderLink,setGame};
})();
PortalAdapter.init();`;

// ── GITHUB API HELPERS ────────────────────────────────────────────────────────

async function ghGet(token, path) {
  const res = await fetch(`https://api.github.com/${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (!res.ok) throw new Error(`GET ${path} → ${res.status} ${await res.text()}`);
  return res.json();
}

async function ghPut(token, path, body) {
  const res = await fetch(`https://api.github.com/${path}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`PUT ${path} → ${res.status} ${await res.text()}`);
  return res.json();
}

function b64encode(str) {
  return Buffer.from(str, "utf8").toString("base64");
}

function b64decode(str) {
  return Buffer.from(str, "base64").toString("utf8");
}

// Get file SHA + content
async function getFile(token, owner, repo, filePath) {
  try {
    const data = await ghGet(token, `repos/${owner}/${repo}/contents/${filePath}`);
    return { sha: data.sha, content: b64decode(data.content.replace(/\n/g, "")) };
  } catch (e) {
    if (e.message.includes("404")) return null;
    throw e;
  }
}

// Commit a file (create or update)
async function commitFile(token, owner, repo, filePath, content, message, sha) {
  const body = {
    message,
    content: b64encode(content),
  };
  if (sha) body.sha = sha;
  return ghPut(token, `repos/${owner}/${repo}/contents/${filePath}`, body);
}

// ── PATCH HTML — inject adapter script tag ────────────────────────────────────

function injectAdapterScript(html, gameId) {
  const scriptTag = `<script src="${ADAPTER_URL}"><\/script>\n<script>PortalAdapter.init("${gameId}");<\/script>`;

  // Don't double-inject
  if (html.includes("portal-adapter.js")) {
    console.log("    ↳ adapter already present, skipping inject");
    return null;
  }

  // Prefer injecting before </head>, else before </body>, else append
  if (html.includes("</head>")) {
    return html.replace("</head>", `${scriptTag}\n</head>`);
  } else if (html.includes("</body>")) {
    return html.replace("</body>", `${scriptTag}\n</body>`);
  } else {
    return html + "\n" + scriptTag;
  }
}

// ── MAIN ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("═══════════════════════════════════════════");
  console.log("  Parris Multiverse Portal Deployment");
  console.log("═══════════════════════════════════════════\n");

  // Step 1: Deploy portal.html and portal-adapter.js to JoshHub
  console.log("📦 Step 1: Deploying portal files to JoshHub...");
  const hubToken = TOKENS["joshualparris"];
  const [hubOwner, hubRepo] = PORTAL_HTML_REPO.split("/");

  for (const [filePath, content] of [
    [PORTAL_HTML_PATH, PORTAL_HTML],
    [PORTAL_ADAPTER_PATH, PORTAL_ADAPTER_JS],
  ]) {
    try {
      const existing = await getFile(hubToken, hubOwner, hubRepo, filePath);
      await commitFile(
        hubToken, hubOwner, hubRepo, filePath, content,
        `portal: deploy ${filePath.split("/").pop()} for Parris Multiverse`,
        existing?.sha
      );
      console.log(`  ✅ ${filePath}`);
    } catch (e) {
      console.error(`  ❌ ${filePath}: ${e.message}`);
    }
  }

  // Step 2: Patch each game's index.html
  console.log("\n🎮 Step 2: Patching game repos...\n");

  for (const game of GAMES) {
    const { account, repo, htmlFile, gameId } = game;
    const token = TOKENS[account];

    if (!token || token.startsWith("TOKEN_")) {
      console.log(`  ⏭  ${account}/${repo} — no token, skipping`);
      continue;
    }

    console.log(`  🔧 ${account}/${repo} (${gameId})`);

    try {
      const file = await getFile(token, account, repo, htmlFile);
      if (!file) {
        console.log(`    ❌ ${htmlFile} not found`);
        continue;
      }

      const patched = injectAdapterScript(file.content, gameId);
      if (!patched) continue; // already patched

      await commitFile(
        token, account, repo, htmlFile, patched,
        `portal: add Parris Multiverse portal adapter (${gameId})`,
        file.sha
      );
      console.log(`    ✅ patched + committed`);
    } catch (e) {
      console.error(`    ❌ error: ${e.message}`);
    }
  }

  console.log("\n═══════════════════════════════════════════");
  console.log("  Done. GitHub Pages will redeploy shortly.");
  console.log("  Test a portal: open any game and append");
  console.log("  ?portal=true&from=null to the URL.");
  console.log("═══════════════════════════════════════════\n");
  console.log("⚠️  Remember to revoke your tokens at:");
  console.log("   https://github.com/settings/personal-access-tokens\n");
}

main().catch(console.error);
