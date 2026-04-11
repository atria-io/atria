const ENABLE_LUCIDE_BUILD_PATCH = true;
const REMOVE_LUCIDE_SVG_BASE_ATTRIBUTES = true;

const normalizePath = (value) => value.replaceAll("\\", "/");

const ICON_MODULE_PATH = "/lucide-react/dist/esm/Icon.js";
const CREATE_ICON_MODULE_PATH = "/lucide-react/dist/esm/createLucideIcon.js";
const DEFAULT_ATTRIBUTES_MODULE_PATH = "/lucide-react/dist/esm/defaultAttributes.js";

const applyReplacements = (code, replacements) => {
  let next = code;
  for (const [from, to] of replacements) {
    next = next.replace(from, to);
  }
  return next;
};

const iconModuleReplacements = () => {
  const replacements = [
    ['className: mergeClasses("lucide", contextClass, className),', "className: mergeClasses(contextClass, className),"]
  ];

  if (REMOVE_LUCIDE_SVG_BASE_ATTRIBUTES) {
    replacements.push(["        stroke: color ?? contextColor,\n", ""]);
    replacements.push(["        strokeWidth: calculatedStrokeWidth,\n", ""]);
  }

  return replacements;
};

const createIconModuleReplacements = () => [
  [
    /className:\s*mergeClasses\(\s*`lucide-\$\{toKebabCase\(toPascalCase\(iconName\)\)\}`,\s*`lucide-\$\{iconName\}`,\s*className\s*\),/g,
    "className,"
  ]
];

const defaultAttributesModuleReplacements = () => [
  ['  xmlns: "http://www.w3.org/2000/svg",\n', ""],
  ['  fill: "none",\n', ""],
  ['  stroke: "currentColor",\n', ""],
  ['  strokeWidth: 2,\n', ""],
  ['  strokeLinecap: "round",\n', ""],
  ['  strokeLinejoin: "round"\n', ""]
];

export const stripLucideInternalClasses = () => ({
  name: "strip-lucide-internal-classes",
  transform(code, id) {
    if (!ENABLE_LUCIDE_BUILD_PATCH) {
      return null;
    }

    const moduleId = normalizePath(id);

    const replacements = moduleId.includes(ICON_MODULE_PATH)
      ? iconModuleReplacements()
      : moduleId.includes(CREATE_ICON_MODULE_PATH)
        ? createIconModuleReplacements()
        : REMOVE_LUCIDE_SVG_BASE_ATTRIBUTES && moduleId.includes(DEFAULT_ATTRIBUTES_MODULE_PATH)
          ? defaultAttributesModuleReplacements()
        : null;

    if (!replacements) return null;

    const next = applyReplacements(code, replacements);
    if (next === code) return null;
    return { code: next, map: null };
  }
});
