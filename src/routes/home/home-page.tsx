import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  PlusIcon,
  FolderOpenIcon,
  UploadIcon,
  GameControllerIcon,
  MagnifyingGlassIcon,
  CaretDownIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LunaraLogo } from "@/components/lunara-logo";
import { useStore } from "@/store";
import { save as saveCartridge } from "@/db/cartridge-repository";
import { importLun } from "@/cartridge/export";
import { ProjectCard } from "./project-card";
import { NewProjectDialog } from "./new-project-dialog";
import type { Template } from "./templates";

export function HomePage() {
  const navigate = useNavigate();
  const { projects, loadProjects, deleteProject } = useStore();
  const [showDialog, setShowDialog] = useState(false);
  const [search, setSearch] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter(
      (c) =>
        c.meta.name.toLowerCase().includes(q) ||
        c.meta.author?.toLowerCase().includes(q),
    );
  }, [projects, search]);

  async function handleCreate(
    template: Template,
    name: string,
    author: string,
  ) {
    const cartridge = template.create(name, author);
    await saveCartridge(cartridge);
    await loadProjects();
    setShowDialog(false);
    navigate(`/editor/${cartridge.meta.id}`);
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const cartridge = await importLun(file);
      cartridge.meta.updated = Date.now();
      await saveCartridge(cartridge);
      await loadProjects();
      navigate(`/editor/${cartridge.meta.id}`);
    } catch {
      alert("Invalid or corrupted .lun file.");
    }
    e.target.value = "";
  }

  return (
    <div className="flex min-h-screen flex-col bg-surface-base text-white">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".lun,.json"
        className="hidden"
        onChange={handleImport}
      />

      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-white/15 bg-surface-base/95 px-6 py-3 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center gap-4">
          {/* Logo */}
          <button onClick={() => navigate("/")}>
            <LunaraLogo />
          </button>

          <Separator orientation="vertical" className="h-5 bg-white/15" />

          {/* Search */}
          <div className="relative max-w-xs flex-1">
            <MagnifyingGlassIcon
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-300"
            />
            <Input
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 border-white/10 bg-white/5 pl-9 text-xs text-zinc-100 placeholder:text-zinc-300 focus-visible:ring-violet-500/50"
            />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/launch")}
              className="h-8 gap-1.5 text-xs text-zinc-300 hover:bg-violet-500/10 hover:text-violet-300"
            >
              <GameControllerIcon size={14} /> Play .png
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  className="h-8 gap-1.5 bg-violet-600 text-xs hover:bg-violet-500"
                >
                  <PlusIcon size={13} weight="bold" /> New Project
                  <CaretDownIcon size={11} className="ml-0.5 opacity-70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="border-white/12 bg-surface-overlay"
              >
                <DropdownMenuItem
                  onClick={() => setShowDialog(true)}
                  className="cursor-pointer gap-2 text-xs focus:bg-white/8 focus:text-white"
                >
                  <PlusIcon size={13} weight="bold" /> New Project
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem
                  onClick={() => fileInputRef.current?.click()}
                  className="cursor-pointer gap-2 text-xs focus:bg-white/8 focus:text-white"
                >
                  <UploadIcon size={13} /> Import .lun
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        {/* Title row */}
        <div className="mb-6 flex items-baseline gap-3">
          <h1 className="text-2xl font-bold text-white">Projects</h1>
          {projects.length > 0 && (
            <span className="rounded-full bg-white/8 px-2 py-0.5 font-mono text-xs text-zinc-300">
              {filtered.length}
              {search ? `/${projects.length}` : ""}
            </span>
          )}
        </div>

        {projects.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center border border-dashed border-white/12 py-32 text-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center border border-white/12 bg-violet-500/5 shadow-lg shadow-violet-500/10">
              <FolderOpenIcon
                size={32}
                className="text-violet-400"
                weight="duotone"
              />
            </div>
            <h2 className="text-xl font-semibold text-zinc-100">No projects yet</h2>
            <p className="mt-1.5 max-w-[280px] text-sm text-zinc-300">
              Create your first game or import an existing{" "}
              <span className="font-mono text-zinc-300">.lun</span> file.
            </p>
            <div className="mt-6 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="gap-1.5 border-white/12 bg-transparent text-zinc-300 hover:bg-white/5 hover:text-white"
              >
                <UploadIcon size={13} /> Import .lun
              </Button>
              <Button
                size="sm"
                onClick={() => setShowDialog(true)}
                className="gap-1.5 bg-violet-600 hover:bg-violet-500"
              >
                <PlusIcon size={13} weight="bold" /> New Project
              </Button>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          /* No search results */
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <MagnifyingGlassIcon size={32} className="mb-4 text-zinc-300" />
            <p className="text-sm text-zinc-300">
              No projects matching{" "}
              <span className="font-mono text-zinc-200">"{search}"</span>
            </p>
            <button
              onClick={() => setSearch("")}
              className="mt-2 text-xs text-violet-400 hover:text-violet-300"
            >
              Clear search
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {filtered.map((c) => (
              <ProjectCard
                key={c.meta.id}
                cartridge={c}
                onDelete={(id) => deleteProject(id)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-white/12 px-6 py-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-between">
          <LunaraLogo />

          <p className="text-[10px] uppercase tracking-widest text-zinc-300">
            A fantasy console for making retro-style games with Lua.
          </p>

          <div className="flex items-center gap-4 text-[10px] font-medium text-zinc-300">
            <a
              href="https://github.com/MateusGX"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-violet-400"
            >
              by Mateus Martins
            </a>
            <span className="text-white/15">·</span>
            <a
              href="https://github.com/MateusGX/lunara-engine/blob/main/LICENSE"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-violet-400"
            >
              Lunara License
            </a>
            <span className="text-white/15">·</span>
            <a
              href="https://github.com/MateusGX/lunara-engine"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-violet-400"
            >
              GitHub
            </a>
            <span className="text-white/15">·</span>
            <span className="font-mono text-zinc-400">v1.0.0</span>
          </div>
        </div>
      </footer>

      <NewProjectDialog
        open={showDialog}
        onClose={() => setShowDialog(false)}
        onCreate={handleCreate}
      />
    </div>
  );
}
