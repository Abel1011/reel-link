import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Users,
  Plus,
  Image,
  Mic,
  Trash2,
  RefreshCw,
  Pencil,
  X,
  User,
  Palette,
} from "lucide-react";
import { api } from "../lib/api";
import type { StoryProject, Character } from "../lib/types";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input, Textarea } from "../components/ui/Input";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { ErrorToast } from "../components/ui/ErrorToast";
import { PageHeader } from "../components/ui/PageHeader";
import { AudioPlayer } from "../components/ui/AudioPlayer";

export default function CharactersPage() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<StoryProject | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [creating, setCreating] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [saving, setSaving] = useState(false);

  const [portraitLoading, setPortraitLoading] = useState<Record<string, boolean>>({});
  const [voiceLoading, setVoiceLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    api
      .get<StoryProject>(`/api/projects/${id}`)
      .then((p) => {
        setProject(p);
        setCharacters(p.characters);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleCreate() {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const char = await api.post<Character>(`/api/projects/${id}/characters`, {
        name: newName.trim(),
        description: newDesc.trim(),
      });
      setCharacters((prev) => [...prev, char]);
      setNewName("");
      setNewDesc("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create character");
    } finally {
      setCreating(false);
    }
  }

  function startEdit(char: Character) {
    setEditingId(char.id);
    setEditName(char.name);
    setEditDesc(char.description);
  }

  async function handleSaveEdit() {
    if (!editingId || !editName.trim()) return;
    setSaving(true);
    try {
      const updated = await api.put<Character>(
        `/api/projects/${id}/characters/${editingId}`,
        { name: editName.trim(), description: editDesc.trim() },
      );
      setCharacters((prev) => prev.map((c) => (c.id === editingId ? updated : c)));
      setEditingId(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to update character");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(charId: string) {
    try {
      await api.delete(`/api/projects/${id}/characters/${charId}`);
      setCharacters((prev) => prev.filter((c) => c.id !== charId));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to delete character");
    }
  }

  async function handleGeneratePortrait(charId: string) {
    setPortraitLoading((prev) => ({ ...prev, [charId]: true }));
    try {
      const updated = await api.post<Character>(
        `/api/projects/${id}/characters/${charId}/generate-portrait`,
      );
      setCharacters((prev) => prev.map((c) => (c.id === charId ? updated : c)));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to generate portrait");
    } finally {
      setPortraitLoading((prev) => ({ ...prev, [charId]: false }));
    }
  }

  async function handleAssignVoice(charId: string) {
    setVoiceLoading((prev) => ({ ...prev, [charId]: true }));
    try {
      const updated = await api.post<Character>(
        `/api/projects/${id}/characters/${charId}/generate-voice`,
      );
      setCharacters((prev) => prev.map((c) => (c.id === charId ? updated : c)));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to assign voice");
    } finally {
      setVoiceLoading((prev) => ({ ...prev, [charId]: false }));
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center py-32">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8 md:px-8 md:py-10">
      <PageHeader
        step="Step 02 · Casting"
        title="The cast"
        subtitle="Meet the people (or foxes, robots, ghosts) who live in your story."
        icon={Users}
        right={
          <div className="flex flex-wrap items-center gap-2">
            {project?.style?.presetName && (
              <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-tomato-400 bg-tomato-50 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-tomato-600">
                <Palette className="h-3 w-3" />
                {project.style.presetName}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink-600 bg-paper-50 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-500">
              <Users className="h-3 w-3" />
              {characters.length.toString().padStart(2, "0")} on call
            </span>
          </div>
        }
      />

      {/* Add character */}
      <Card className="mb-10">
        <div className="mb-4 flex items-center gap-2">
          <Plus className="h-4 w-4 text-tomato-500" />
          <h3 className="font-display text-lg font-semibold text-ink-700">
            Add to the call sheet
          </h3>
        </div>
        <div className="flex flex-col gap-4">
          <Input
            label="Name"
            placeholder="e.g. Captain Fox"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <Textarea
            label="Description"
            placeholder="A brave fox with a red scarf, a gentle voice and a taste for lemon tea..."
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            rows={3}
          />
        </div>
        <Button
          className="mt-5"
          loading={creating}
          disabled={!newName.trim()}
          onClick={handleCreate}
        >
          <Plus className="h-4 w-4" />
          Sign them on
        </Button>
      </Card>

      {/* Character list */}
      {characters.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-ink-300 bg-paper-50 py-14 text-center">
          <User className="mx-auto h-6 w-6 text-ink-300" />
          <p className="mt-3 font-display text-lg font-semibold text-ink-600">
            Empty casting couch
          </p>
          <p className="mt-1 text-sm text-ink-400">
            Add your first character above.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {characters.map((char, idx) => (
            <div
              key={char.id}
              className="relative rounded-xl border-2 border-ink-600 bg-paper-50 p-4 shadow-[5px_5px_0_0_var(--color-ink-600)] sm:p-5"
            >
              {/* Card № */}
              <div className="absolute -top-3 left-5 bg-paper-100 px-2 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-400">
                Cast № {(idx + 1).toString().padStart(2, "0")}
              </div>

              <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-5">
                {/* Polaroid */}
                <div className="shrink-0">
                  <div className="rotate-[-1.5deg] rounded-sm border-2 border-ink-600 bg-paper-50 p-2 shadow-[4px_4px_0_0_var(--color-ink-600)]">
                    <div className="flex h-36 w-32 items-center justify-center overflow-hidden border border-ink-200 bg-paper-200">
                      {portraitLoading[char.id] ? (
                        <LoadingSpinner size="sm" />
                      ) : char.portraitPath ? (
                        <img
                          src={`/assets/${char.portraitPath}`}
                          alt={`${char.name} portrait`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <User className="h-10 w-10 text-ink-300" />
                      )}
                    </div>
                    <div className="mt-1.5 text-center font-display text-xs italic text-ink-600">
                      {char.name || "Unknown"}
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div className="min-w-0 w-full flex-1">
                  {editingId === char.id ? (
                    <div className="flex flex-col gap-3">
                      <Input
                        label="Name"
                        placeholder="Name"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                      />
                      <Textarea
                        label="Description"
                        placeholder="Description"
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <Button size="sm" loading={saving} onClick={handleSaveEdit}>
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setEditingId(null)}
                        >
                          <X className="h-3.5 w-3.5" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h4 className="font-display text-xl font-semibold text-ink-700">
                        {char.name}
                      </h4>
                      <p className="mt-1 line-clamp-3 text-sm text-ink-500">
                        {char.description || "No description yet."}
                      </p>
                      <span
                        className={`mt-3 inline-flex items-center gap-1.5 rounded-full border-2 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.2em] ${
                          char.voiceName
                            ? "border-sage-400 bg-sage-50 text-sage-500"
                            : "border-ink-200 bg-paper-100 text-ink-400"
                        }`}
                      >
                        <Mic className="h-3 w-3" />
                        {char.voiceName || "No voice"}
                      </span>
                      {char.voicePreviewUrl && (
                        <div className="mt-3">
                          <AudioPlayer src={char.voicePreviewUrl} />
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {editingId !== char.id && (
                <div className="mt-4 flex flex-wrap gap-2 border-t-2 border-dashed border-ink-200 pt-4">
                  <Button
                    size="sm"
                    variant="secondary"
                    loading={portraitLoading[char.id]}
                    onClick={() => handleGeneratePortrait(char.id)}
                  >
                    {char.portraitPath ? (
                      <RefreshCw className="h-3.5 w-3.5" />
                    ) : (
                      <Image className="h-3.5 w-3.5" />
                    )}
                    {char.portraitPath ? "Reshoot" : "Headshot"}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    loading={voiceLoading[char.id]}
                    onClick={() => handleAssignVoice(char.id)}
                  >
                    <Mic className="h-3.5 w-3.5" />
                    {char.voiceName ? "Recast voice" : "Cast voice"}
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => startEdit(char)}>
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => handleDelete(char.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                    Drop
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {error && <ErrorToast message={error} onClose={() => setError(null)} />}
    </div>
  );
}
