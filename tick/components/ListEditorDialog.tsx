"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  LIST_EMOJI_OPTIONS,
  normalizeListEmoji,
  WATCHLIST_NAME,
} from "@/lib/lists";
import { cn } from "@/lib/utils";

interface ListEditorDialogProps {
  mode: "create" | "edit";
  defaultName?: string;
  defaultEmoji: string;
  nameLocked?: boolean;
  onClose: () => void;
  onSubmit: (values: { name: string; emoji: string }) => void;
}

export function ListEditorDialog({
  mode,
  defaultName = "",
  defaultEmoji,
  nameLocked = false,
  onClose,
  onSubmit,
}: ListEditorDialogProps) {
  const [name, setName] = React.useState(defaultName);
  const [emoji, setEmoji] = React.useState(defaultEmoji);

  React.useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const resolvedName = nameLocked ? WATCHLIST_NAME : name.trim();
  const canSubmit = nameLocked ? true : resolvedName.length > 0;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;

    onSubmit({
      name: resolvedName,
      emoji: normalizeListEmoji(emoji, defaultEmoji),
    });
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 px-4 py-8 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-border/60 bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold">
              {mode === "create" ? "Create List" : "Edit List"}
            </h2>
            <p className="text-sm text-muted-foreground">
              Pick an emoji and save a name that feels easy to scan.
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label="Close list editor"
          >
            <X className="size-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-5 py-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              List name
            </label>
            <Input
              value={nameLocked ? WATCHLIST_NAME : name}
              onChange={(event) => setName(event.target.value)}
              disabled={nameLocked}
              maxLength={40}
              placeholder="Growth ideas"
              className="h-10 rounded-xl px-3"
            />
            {nameLocked && (
              <p className="text-xs text-muted-foreground">
                The built-in watchlist keeps its name, but you can still change its emoji.
              </p>
            )}
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">
              Emoji
            </label>
            <div className="flex flex-wrap gap-2">
              {LIST_EMOJI_OPTIONS.map((option) => {
                const isSelected = normalizeListEmoji(emoji, defaultEmoji) === option;

                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setEmoji(option)}
                    className={cn(
                      "flex size-11 items-center justify-center rounded-2xl border border-border/60 bg-muted/40 text-xl transition-colors hover:bg-muted",
                      isSelected && "border-primary bg-primary/10 ring-2 ring-primary/30"
                    )}
                    aria-label={`Choose ${option} emoji`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Or type one emoji
              </label>
              <Input
                value={emoji}
                onChange={(event) => setEmoji(event.target.value)}
                maxLength={8}
                placeholder="🌙"
                className="h-10 rounded-xl px-3 text-lg"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {mode === "create" ? "Create List" : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
