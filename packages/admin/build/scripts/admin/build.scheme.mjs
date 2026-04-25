import path from "node:path";
import { mkdir, readFile, writeFile } from "node:fs/promises";

const getPaths = (packageRoot) => {

  const schemeCssFile = path.join(packageRoot, "boot", "static", "styles", "scheme.css");
  const outputFile = path.join(packageRoot, "dist", "frontend", "static", "js", "scheme.js");

  return { schemeCssFile, outputFile };
};

const extractSchemeBlock = (css, scheme) => {
  const pattern = new RegExp(`\\[data-scheme="${scheme}"\\]\\s*\\{([\\s\\S]*?)\\}`, "m");
  const match = css.match(pattern);
  if (!match) {
    throw new Error(`Missing [data-scheme="${scheme}"] block in scheme.css`);
  }

  return match[1];
};

const extractTokens = (block, scheme) => {
  const tokens = {};
  const tokenPattern = /--([a-z0-9-]+)\s*:\s*([^;]+);/gi;
  let match;

  while ((match = tokenPattern.exec(block)) !== null) {
    const tokenName = match[1]?.trim();
    const tokenValue = match[2]?.trim();
    if (!tokenName || !tokenValue) {
      continue;
    }

    tokens[tokenName] = tokenValue;
  }

  if (!tokens.background) {
    throw new Error(`Missing --background in [data-scheme="${scheme}"] block`);
  }

  if (!tokens.text) {
    throw new Error(`Missing --text in [data-scheme="${scheme}"] block`);
  }

  return tokens;
};

const buildRuntimeSource = (tokenMap) =>
  `(()=>{const TOKENS=${JSON.stringify(tokenMap)},STORAGE_KEY="atria:color-scheme",STYLE_ID="atria-scheme",VALID_MODES=new Set(["system","light","dark"]),readStoredMode=()=>{try{const value=localStorage.getItem(STORAGE_KEY)??"system";return VALID_MODES.has(value)?value:"system"}catch{return"system"}},resolveMode=(mode)=>mode!=="system"?mode:typeof window.matchMedia!=="function"?"light":window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light",ensureStyleElement=()=>{let styleElement=document.getElementById(STYLE_ID);if(styleElement)return styleElement;styleElement=document.createElement("style");styleElement.id=STYLE_ID;document.head.appendChild(styleElement);return styleElement},toCss=(tokens)=>":root{"+Object.entries(tokens).map(([name,value])=>"--"+name+":"+value).join(";")+"}html,body{background:var(--background);color:var(--text);}";let resolved=resolveMode(readStoredMode());const subscribers=new Set,notify=()=>{for(const subscriber of subscribers)try{subscriber(resolved)}catch{}},persistMode=(nextMode)=>{try{localStorage.setItem(STORAGE_KEY,nextMode)}catch{}},syncDomScheme=(nextScheme)=>{const shellNodes=document.querySelectorAll(".admin-shell[data-scheme]");for(const shellNode of shellNodes)shellNode.getAttribute("data-scheme")!==nextScheme&&shellNode.setAttribute("data-scheme",nextScheme)},applyScheme=(nextScheme)=>{if(nextScheme!=="light"&&nextScheme!=="dark")return;resolved=nextScheme;const styleElement=ensureStyleElement();styleElement.textContent=toCss(TOKENS[resolved]);syncDomScheme(resolved);notify()},refreshFromStorage=()=>{applyScheme(resolveMode(readStoredMode()))},rootApi=window.__atria__??(window.__atria__={});function setMode(nextMode){VALID_MODES.has(nextMode)&&(persistMode(nextMode),refreshFromStorage())}rootApi.scheme={get mode(){return readStoredMode()},get resolved(){return refreshFromStorage(),resolved},setMode,subscribe(onChange){if(typeof onChange!=="function")return;subscribers.add(onChange);return()=>{subscribers.delete(onChange)}}},typeof window.addEventListener==="function"&&window.addEventListener("storage",(event)=>{event.key===STORAGE_KEY&&refreshFromStorage()}),typeof window.matchMedia==="function"&&(()=>{const media=window.matchMedia("(prefers-color-scheme: dark)"),onChange=()=>{readStoredMode()==="system"&&refreshFromStorage()};typeof media.addEventListener==="function"?media.addEventListener("change",onChange):typeof media.addListener==="function"&&media.addListener(onChange)})();const isObservedSchemeTarget=(target)=>target===document.documentElement||(target instanceof Element&&target.matches(".admin-shell[data-scheme]"));const schemeObserver=new MutationObserver((mutations)=>{for(const mutation of mutations){if(mutation.type!=="attributes"||mutation.attributeName!=="data-scheme")continue;const target=mutation.target;if(!(target instanceof Element)||!isObservedSchemeTarget(target))continue;const nextScheme=target.getAttribute("data-scheme");if(nextScheme!=="light"&&nextScheme!=="dark")continue;readStoredMode()==="system"?applyScheme(nextScheme):(persistMode(nextScheme),applyScheme(nextScheme));}});schemeObserver.observe(document.documentElement,{attributes:!0,subtree:!0,attributeFilter:["data-scheme"]});refreshFromStorage();const currentScript=document.currentScript;currentScript&&currentScript.parentNode&&currentScript.parentNode.removeChild(currentScript)})();`;

export const runSchemeBundle = async (packageRoot) => {
  const paths = getPaths(packageRoot);
  const source = await readFile(paths.schemeCssFile, "utf-8");

  const darkTokens = extractTokens(extractSchemeBlock(source, "dark"), "dark");
  const lightTokens = extractTokens(extractSchemeBlock(source, "light"), "light");
  const runtimeSource = buildRuntimeSource({ light: lightTokens, dark: darkTokens });

  await mkdir(path.dirname(paths.outputFile), { recursive: true });
  await writeFile(paths.outputFile, runtimeSource, "utf-8");
};
