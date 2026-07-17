// The crayon-melt loader in index.html tracks real boot work through this
// hook. "fonts" is settled by the loader itself; the app settles the rest.
interface Window {
  __cpBootSettle?: (task: "app" | "stash") => void;
}
