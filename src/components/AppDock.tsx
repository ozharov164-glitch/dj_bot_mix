import { hapticImpact, hapticSelection } from "../lib/telegram";
import { IconPlus, IconProjects } from "./icons";

type AppDockProps = {
  active: "projects" | "create";
  onProjects: () => void;
  onCreate: () => void;
};

/** Persistent bottom nav — dual destinations for clear routing. */
export function AppDock({ active, onProjects, onCreate }: AppDockProps) {
  return (
    <nav className="app-dock" aria-label="Основная навигация">
      <div className="app-dock__glass" aria-hidden="true" />
      <div className="app-dock__inner">
        <button
          type="button"
          className={
            active === "projects"
              ? "app-dock__tab app-dock__tab--active"
              : "app-dock__tab"
          }
          aria-current={active === "projects" ? "page" : undefined}
          onClick={() => {
            hapticSelection();
            onProjects();
          }}
        >
          <span className="app-dock__icon" aria-hidden="true">
            <IconProjects size={24} />
          </span>
          <span className="app-dock__label">Проекты</span>
        </button>

        <button
          type="button"
          className={
            active === "create"
              ? "app-dock__tab app-dock__tab--active app-dock__tab--cta"
              : "app-dock__tab app-dock__tab--cta"
          }
          aria-current={active === "create" ? "page" : undefined}
          onClick={() => {
            hapticImpact("medium");
            onCreate();
          }}
        >
          <span className="app-dock__icon app-dock__icon--plus" aria-hidden="true">
            <IconPlus size={24} />
          </span>
          <span className="app-dock__label">Новый</span>
        </button>
      </div>
    </nav>
  );
}
