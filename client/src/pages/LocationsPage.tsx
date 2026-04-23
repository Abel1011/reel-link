import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  MapPin,
  Plus,
  Image,
  Trash2,
  RefreshCw,
  Pencil,
  X,
  Map,
  Palette,
  Compass,
} from "lucide-react";
import { api } from "../lib/api";
import type { StoryProject, Location } from "../lib/types";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input, Textarea } from "../components/ui/Input";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { ErrorToast } from "../components/ui/ErrorToast";
import { PageHeader } from "../components/ui/PageHeader";

export default function LocationsPage() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<StoryProject | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [creating, setCreating] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [saving, setSaving] = useState(false);

  const [imageLoading, setImageLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    api
      .get<StoryProject>(`/api/projects/${id}`)
      .then((p) => {
        setProject(p);
        setLocations(p.locations);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleCreate() {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const loc = await api.post<Location>(`/api/projects/${id}/locations`, {
        name: newName.trim(),
        description: newDesc.trim(),
      });
      setLocations((prev) => [...prev, loc]);
      setNewName("");
      setNewDesc("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create location");
    } finally {
      setCreating(false);
    }
  }

  function startEdit(loc: Location) {
    setEditingId(loc.id);
    setEditName(loc.name);
    setEditDesc(loc.description);
  }

  async function handleSaveEdit() {
    if (!editingId || !editName.trim()) return;
    setSaving(true);
    try {
      const updated = await api.put<Location>(
        `/api/projects/${id}/locations/${editingId}`,
        { name: editName.trim(), description: editDesc.trim() },
      );
      setLocations((prev) => prev.map((l) => (l.id === editingId ? updated : l)));
      setEditingId(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to update location");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(locId: string) {
    try {
      await api.delete(`/api/projects/${id}/locations/${locId}`);
      setLocations((prev) => prev.filter((l) => l.id !== locId));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to delete location");
    }
  }

  async function handleGenerateImage(locId: string) {
    setImageLoading((prev) => ({ ...prev, [locId]: true }));
    try {
      const updated = await api.post<Location>(
        `/api/projects/${id}/locations/${locId}/generate-image`,
      );
      setLocations((prev) => prev.map((l) => (l.id === locId ? updated : l)));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to generate image");
    } finally {
      setImageLoading((prev) => ({ ...prev, [locId]: false }));
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
        step="Step 03 · Scouting"
        title="The locations"
        subtitle="Scout the sets where your story unfolds. Snap a reference image and move on."
        icon={MapPin}
        right={
          <div className="flex flex-wrap items-center gap-2">
            {project?.style?.presetName && (
              <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-tomato-400 bg-tomato-50 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-tomato-600">
                <Palette className="h-3 w-3" />
                {project.style.presetName}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink-600 bg-paper-50 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-500">
              <MapPin className="h-3 w-3" />
              {locations.length.toString().padStart(2, "0")} scouted
            </span>
          </div>
        }
      />

      <Card className="mb-10">
        <div className="mb-4 flex items-center gap-2">
          <Plus className="h-4 w-4 text-tomato-500" />
          <h3 className="font-display text-lg font-semibold text-ink-700">
            Scout a new set
          </h3>
        </div>
        <div className="flex flex-col gap-4">
          <Input
            label="Name"
            placeholder="e.g. Enchanted Forest"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <Textarea
            label="Description"
            placeholder="A mystical forest at dusk, glowing mushrooms, mossy stones and a winding river..."
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
          Add the set
        </Button>
      </Card>

      {locations.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-ink-300 bg-paper-50 py-14 text-center">
          <Map className="mx-auto h-6 w-6 text-ink-300" />
          <p className="mt-3 font-display text-lg font-semibold text-ink-600">
            No sets yet
          </p>
          <p className="mt-1 text-sm text-ink-400">
            Every story needs a stage. Build one above.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {locations.map((loc, idx) => (
            <div
              key={loc.id}
              className="relative flex flex-col overflow-hidden rounded-xl border-2 border-ink-600 bg-paper-50 shadow-[5px_5px_0_0_var(--color-ochre-400)]"
            >
              <div className="absolute -top-3 left-5 z-10 bg-paper-100 px-2 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-400">
                Set № {(idx + 1).toString().padStart(2, "0")}
              </div>

              {/* Postcard (wide landscape) */}
              <div className="relative w-full border-b-2 border-ink-600 bg-paper-200" style={{ aspectRatio: "16/9" }}>
                {imageLoading[loc.id] ? (
                  <div className="flex h-full w-full items-center justify-center">
                    <LoadingSpinner size="md" />
                  </div>
                ) : loc.imagePath ? (
                  <img
                    src={`/assets/${loc.imagePath}`}
                    alt={`${loc.name} background`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-[repeating-linear-gradient(135deg,var(--color-paper-100)_0_12px,var(--color-paper-200)_12px_24px)]">
                    <Compass className="h-8 w-8 text-ink-300" />
                    <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-400">
                      No reference yet
                    </span>
                  </div>
                )}
                <span className="absolute left-3 top-3 rounded border-2 border-ink-600 bg-paper-50 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-ink-700 shadow-[2px_2px_0_0_var(--color-ink-600)]">
                  Postcard
                </span>
              </div>

              <div className="flex flex-1 flex-col p-5">
                {editingId === loc.id ? (
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
                    <h4 className="truncate font-display text-xl font-semibold text-ink-700">
                      {loc.name}
                    </h4>
                    <p className="mt-1 line-clamp-3 flex-1 text-sm text-ink-500">
                      {loc.description || "No description yet."}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2 border-t-2 border-dashed border-ink-200 pt-3">
                      <Button
                        size="sm"
                        variant="secondary"
                        loading={imageLoading[loc.id]}
                        onClick={() => handleGenerateImage(loc.id)}
                      >
                        {loc.imagePath ? (
                          <RefreshCw className="h-3.5 w-3.5" />
                        ) : (
                          <Image className="h-3.5 w-3.5" />
                        )}
                        {loc.imagePath ? "Re-scout" : "Snap reference"}
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => startEdit(loc)}>
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => handleDelete(loc.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                        Strike
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {error && <ErrorToast message={error} onClose={() => setError(null)} />}
    </div>
  );
}
