import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MessageCenter } from "@/components/room/message-center";
import { makeDemoData } from "@/components/room/demo-data";

describe("Centro messaggi", () => {
  it("mantiene la Lobby in cima e mostra i messaggi esistenti", () => {
    const data = makeDemoData();
    render(<MessageCenter data={data} activeConversationId="demo-lobby" onActiveConversation={vi.fn()} draft="" onDraft={vi.fn()} unreadTotal={1} unreadByConversation={{ "demo-lobby": 1 }} pending={false} schemaAvailable onSend={vi.fn(async () => true)} onOpenAttachment={vi.fn(async () => undefined)} onCreate={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getAllByText("Lobby generale").length).toBeGreaterThan(0);
    expect(screen.getByText(/Perfetto, io finisco la lezione/)).toBeInTheDocument();
    expect(screen.getByText(/Invio per spedire/)).toBeInTheDocument();
  });

  it("crea una chat privata soltanto dopo aver scelto un partecipante", async () => {
    const create = vi.fn(async () => undefined);
    render(<MessageCenter data={makeDemoData()} activeConversationId="demo-lobby" onActiveConversation={vi.fn()} draft="" onDraft={vi.fn()} unreadTotal={0} unreadByConversation={{}} pending={false} schemaAvailable onSend={vi.fn(async () => true)} onOpenAttachment={vi.fn(async () => undefined)} onCreate={create} onClose={vi.fn()} />);
    fireEvent.click(screen.getByTitle("Nuova conversazione"));
    const submit = screen.getByRole("button", { name: "Crea conversazione" });
    expect(submit).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: /Tatiana/ }));
    expect(submit).toBeEnabled();
    await act(async () => { fireEvent.click(submit); await Promise.resolve(); });
    expect(create).toHaveBeenCalledWith("private", "", ["demo-tatiana"]);
  });
});
