import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  PlusIcon,
  FolderOpenIcon,
  UploadIcon,
  MagnifyingGlassIcon,
  CaretDownIcon,
  ScrollIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LunaraLogo } from "@/components/lunara-logo";
import { RpgDivider, RpgGlowBg } from "@/components/rpg-ui";
import { useStore } from "@/store";
import { save as saveCartridge } from "@/db/cartridge-repository";
import { importLun } from "@/cartridge/export";
import { ProjectCard } from "./project-card";
import { NewProjectDialog } from "./new-project-dialog";
import { HardwareProfilesTab } from "./hardware-profiles-tab";
import type { HardwareConfig } from "@/types/cartridge";
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
    hw: HardwareConfig,
  ) {
    const cartridge = template.create(name, author);
    cartridge.hardware = hw;
    await saveCartridge(cartridge);
    await loadProjects();
    setShowDialog(false);
    navigate(`/studio/editor/${cartridge.meta.id}`);
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const cartridge = await importLun(file);
      cartridge.meta.updated = Date.now();
      await saveCartridge(cartridge);
      await loadProjects();
      navigate(`/studio/editor/${cartridge.meta.id}`);
    } catch {
      alert("Invalid or corrupted .lun file.");
    }
    e.target.value = "";
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-surface-base text-rpg-parchment overflow-hidden">
      <RpgGlowBg position="50% 0%" />

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".lun,.json"
        className="hidden"
        onChange={handleImport}
      />

      {/* ── Header / Tavern Sign ── */}
      <header className="sticky top-0 z-10 border-b border-rpg-gold/15 bg-surface-base/95 px-6 py-3 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center gap-4">
          <Button
            variant="ghost"
            className="p-0 h-auto"
            onClick={() => navigate("/")}
          >
            <LunaraLogo />
          </Button>

          <div className="h-5 w-px bg-rpg-gold/15" />

          {/* Search scroll */}
          <div className="relative max-w-xs flex-1">
            <MagnifyingGlassIcon
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-rpg-stone"
            />
            <Input
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" className="h-8 gap-1.5 text-xs">
                  <PlusIcon size={13} weight="bold" /> New Project
                  <CaretDownIcon size={11} className="ml-0.5 opacity-70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="border-rpg-gold/20 bg-surface-overlay"
              >
                <DropdownMenuItem
                  onClick={() => setShowDialog(true)}
                  className="cursor-pointer gap-2 text-xs text-rpg-parchment focus:bg-rpg-gold/8 focus:text-rpg-gold"
                >
                  <PlusIcon size={13} weight="bold" /> New Project
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-rpg-gold/12" />
                <DropdownMenuItem
                  onClick={() => fileInputRef.current?.click()}
                  className="cursor-pointer gap-2 text-xs text-rpg-parchment focus:bg-rpg-gold/8 focus:text-rpg-gold"
                >
                  <UploadIcon size={13} /> Import .lun
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        <Tabs defaultValue="projects">
          <TabsList variant="line" className="mb-6">
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="hardware">Hardware Profiles</TabsTrigger>
          </TabsList>

          <TabsContent value="projects">
            {/* Title row */}
            <div className="mb-6 flex items-baseline gap-3">
              <h1 className="text-xl font-bold tracking-widest text-rpg-gold uppercase">
                Projects
              </h1>
              {projects.length > 0 && (
                <span className="border border-rpg-gold/20 bg-rpg-gold/8 px-2 py-0.5 font-mono text-[10px] text-rpg-gold/70">
                  {filtered.length}
                  {search ? `/${projects.length}` : ""}
                </span>
              )}
            </div>

            {projects.length === 0 ? (
              /* Empty state */
              <div className="relative flex flex-col items-center justify-center border border-dashed border-rpg-gold/15 py-32 text-center">
                <span className="pointer-events-none absolute top-0 left-0 h-3 w-3 border-t border-l border-rpg-gold/40" />
                <span className="pointer-events-none absolute top-0 right-0 h-3 w-3 border-t border-r border-rpg-gold/40" />
                <span className="pointer-events-none absolute bottom-0 left-0 h-3 w-3 border-b border-l border-rpg-gold/40" />
                <span className="pointer-events-none absolute bottom-0 right-0 h-3 w-3 border-b border-r border-rpg-gold/40" />

                <div className="mb-5 flex h-16 w-16 items-center justify-center border border-rpg-gold/20 bg-rpg-gold/5">
                  <FolderOpenIcon
                    size={32}
                    className="text-rpg-gold/50"
                    weight="duotone"
                  />
                </div>
                <h2 className="text-lg font-semibold tracking-wider text-rpg-parchment">
                  No projects yet
                </h2>
                <p className="mt-1.5 max-w-64 text-sm text-rpg-stone">
                  Create your first game or import an existing{" "}
                  <span className="font-mono text-rpg-gold/60">.lun</span> file.
                </p>
                <RpgDivider className="my-5 w-40" />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="gap-1.5"
                  >
                    <UploadIcon size={13} /> Import .lun
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setShowDialog(true)}
                    className="gap-1.5"
                  >
                    <PlusIcon size={13} weight="bold" /> New Project
                  </Button>
                </div>
              </div>
            ) : filtered.length === 0 ? (
              /* No search results */
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <ScrollIcon
                  size={32}
                  className="mb-4 text-rpg-stone/50"
                  weight="duotone"
                />
                <p className="text-sm text-rpg-stone">
                  No projects matching{" "}
                  <span className="font-mono text-rpg-gold/60">"{search}"</span>
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearch("")}
                  className="mt-2 text-xs"
                >
                  Clear search
                </Button>
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
          </TabsContent>

          <TabsContent value="hardware">
            <div className="mb-6">
              <h1 className="text-xl font-bold tracking-widest text-rpg-gold uppercase">
                Hardware Profiles
              </h1>
              <p className="mt-1 text-xs text-rpg-stone">
                Hardware configurations for your game cartridges.
              </p>
            </div>
            <HardwareProfilesTab />
          </TabsContent>
        </Tabs>
      </main>

      {/* ── Footer ── */}
      <footer className="mt-auto border-t border-rpg-gold/12 px-6 py-5">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-between">
          <LunaraLogo />
          <p className="text-[10px] uppercase tracking-widest text-rpg-stone/50">
            A fantasy console for making retro-style games with Lua.
          </p>
          <div className="flex items-center gap-4 text-[10px] font-medium text-rpg-stone/50">
            <a
              href="https://github.com/MateusGX"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-rpg-gold"
            >
              by Mateus Martins
            </a>
            <span className="text-rpg-gold/15">·</span>
            <a
              href="https://github.com/MateusGX/lunara-engine/blob/main/LICENSE"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-rpg-gold"
            >
              License
            </a>
            <span className="text-rpg-gold/15">·</span>
            <a
              href="https://github.com/MateusGX/lunara-engine"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-rpg-gold"
            >
              GitHub
            </a>
            <span className="text-rpg-gold/15">·</span>
            <span className="font-mono text-rpg-stone/40">v1.0.0</span>
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
