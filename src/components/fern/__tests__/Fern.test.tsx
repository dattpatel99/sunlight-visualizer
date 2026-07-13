import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Fern } from "../Fern";

beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
});

describe("Fern", () => {
  it("opens the chat panel from the closed nub", async () => {
    render(<Fern location={null} facades={[]} selectedFacade={null} />);
    expect(screen.queryByTestId("fern-panel")).not.toBeInTheDocument();
    await userEvent.click(screen.getByTestId("fern-nub"));
    expect(screen.getByTestId("fern-panel")).toBeInTheDocument();
  });

  it("surfaces the no-key path when sending without an API key", async () => {
    render(<Fern location={null} facades={[]} selectedFacade={null} />);
    await userEvent.click(screen.getByTestId("fern-nub"));
    await userEvent.type(screen.getByLabelText("Ask Fern"), "what can I grow?");
    await userEvent.click(screen.getByRole("button", { name: "Send" }));

    // Fern replies with the setup prompt and offers a link into settings.
    expect(await screen.findByText(/OpenAI API key/i)).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: /Add your API key/i })).toBeInTheDocument();
  });

  it("reaches settings with the model selector and disabled native toggle", async () => {
    render(<Fern location={null} facades={[]} selectedFacade={null} />);
    await userEvent.click(screen.getByTestId("fern-nub"));
    await userEvent.click(screen.getByRole("button", { name: "Settings" }));
    expect(screen.getByLabelText("Model")).toBeInTheDocument();
    expect(screen.getByLabelText(/Native species only/i)).toBeDisabled();
  });
});
