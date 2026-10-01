import { PREFERENCE_REGISTRY } from "@/lib/preferences/preferences-config";

export function ThemeBootScript() {
  const registry = JSON.stringify(PREFERENCE_REGISTRY);
  const code = `
    (function () {
      try {
        var root = document.documentElement;
        var REGISTRY = ${registry};
        function readCookie(name) {
          var match = document.cookie.split("; ").find(function (c) { return c.startsWith(name + "="); });
          return match ? decodeURIComponent(match.split("=")[1]) : null;
        }
        var preferences = {};
        Object.keys(REGISTRY).forEach(function (key) {
          var definition = REGISTRY[key];
          var value = readCookie(key);
          if (definition.values.indexOf(value) < 0) value = definition.defaultValue;
          preferences[key] = value;
          root.setAttribute(definition.attribute, value);
        });
        var mode = preferences.theme_mode;
        var resolved = mode === "dark" ? "dark" : "light";
        root.classList.toggle("dark", resolved === "dark");
        root.style.colorScheme = resolved;
      } catch (e) {}
    })();
  `;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
