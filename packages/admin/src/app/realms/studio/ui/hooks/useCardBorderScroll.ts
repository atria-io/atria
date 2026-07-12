import * as React from "react";

const syncStageClass = (node: Element): void => {
  if (!(node instanceof HTMLElement)) {
    return;
  }

  if (node.scrollTop > 0) {
    node.classList.add("card-stage--scrolled");
    return;
  }

  node.classList.remove("card-stage--scrolled");
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
