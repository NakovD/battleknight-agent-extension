import { cleanup, configure } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";

// Rendering the duels form (sliders and all) takes close to a second in jsdom, so
// the default one second findBy/waitFor timeout makes those tests flaky on a busy
// machine.
configure({ asyncUtilTimeout: 5_000 });

afterEach(() => {
	cleanup();
});
