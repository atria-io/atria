import * as React from "react";

const CLASS_NAME = "card-stage--scrolled";

const syncStageClass = (node: Element): void => {
  if (!(node instanceof HTMLElement)) {
    return;
  }

  if (node.scrollTop > 0) {
    node.classList.add(CLASS_NAME);
    return;
  }

  node.classList.remove(CLASS_NAME);
};

const getStages = (): Array<Element> => {
  return Array.from(document.querySelectorAll(".card-stage"));
};

function useCardBorderScroll(): void {
  React.useEffect(() => {
    const stages = getStages();
    const onScroll = (event: Event): void => {
      const target = event.currentTarget;
      if (!target) {
        return;
      }

      syncStageClass(target as Element);
    };

    for (const stage of stages) {
      syncStageClass(stage);
      stage.addEventListener("scroll", onScroll, { passive: true });
    }

    return () => {
      for (const stage of stages) {
        stage.removeEventListener("scroll", onScroll);
      }
    };
  }, []);
}

export { useCardBorderScroll };
