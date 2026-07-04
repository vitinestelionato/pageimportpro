import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { StickyNote, Plus, Trash2 } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { listNotes, upsertNote, deleteNote } from "@/lib/notes.functions";

export const Route = createFileRoute("/_authenticated/dashboard/anotacoes")({
  head: () => ({ meta: [{ title: "Anotações · ImportPro" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: NotesPage,
});

type Note = { id: string; title: string; body: string; updated_at: string };

function NotesPage() {
  const qc = useQueryClient();
  const fetchList = useServerFn(listNotes);
  const save = useServerFn(upsertNote);
  const remove = useServerFn(deleteNote);

  const { data: notes = [] } = useQuery({ queryKey: ["notes"], queryFn: () => fetchList() as Promise<Note[]> });
  const [selected, setSelected] = useState<Note | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const invalidate = () => qc.invalidateQueries({ queryKey: ["notes"] });

  const saveMut = useMutation({
    mutationFn: () => save({ data: { id: selected?.id, title, body } }),
    onSuccess: (row) => { toast.success("Salvo"); setSelected(row as Note); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => { toast.success("Removido"); setSelected(null); setTitle(""); setBody(""); invalidate(); },
  });

  const openNote = (n: Note) => { setSelected(n); setTitle(n.title); setBody(n.body); };
  const newNote = () => { setSelected(null); setTitle(""); setBody(""); };

  return (
    <DashboardShell breadcrumb="Anotações" title="Anotações">
      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-2xl border border-white/5 bg-card/60 p-3">
          <button onClick={newNote} className="mb-3 inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground">
            <Plus className="h-4 w-4" /> Nova
          </button>
          <ul className="space-y-1">
            {notes.length === 0 && <li className="p-3 text-center text-xs text-muted-foreground">Nenhuma anotação</li>}
            {notes.map((n) => (
              <li key={n.id}>
                <button onClick={() => openNote(n)} className={`flex w-full items-start gap-2 rounded-lg p-2 text-left text-sm hover:bg-white/5 ${selected?.id===n.id?"bg-white/5":""}`}>
                  <StickyNote className="mt-0.5 h-3.5 w-3.5 text-primary" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{n.title || "Sem título"}</div>
                    <div className="truncate text-[11px] text-muted-foreground">{n.body || "..."}</div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <section className="rounded-2xl border border-white/5 bg-card/60 p-6">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título" className="w-full border-0 bg-transparent font-display text-2xl font-bold outline-none placeholder:text-muted-foreground" />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Escreva aqui..." rows={16} className="mt-4 w-full resize-none border-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
          <div className="mt-4 flex items-center gap-2 border-t border-white/5 pt-4">
            <button onClick={() => saveMut.mutate()} disabled={saveMut.isPending} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">
              {saveMut.isPending ? "Salvando..." : "Salvar"}
            </button>
            {selected && (
              <button onClick={() => { if (confirm("Remover?")) delMut.mutate(selected.id); }} className="inline-flex items-center gap-2 rounded-lg border border-destructive/40 px-3 py-2 text-sm text-destructive hover:bg-destructive/10">
                <Trash2 className="h-3.5 w-3.5" /> Excluir
              </button>
            )}
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
