"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PubForm } from "@/components/matchday-matcha/PubForm";
import type { PubInput } from "@/lib/pubs/admin-pubs";
import type { Pub } from "@/types";

interface PubRowProps {
  pub: Pub;
  onUpdate: (id: string, input: PubInput) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function PubRow({ pub, onUpdate, onDelete }: PubRowProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleUpdate = async (input: PubInput) => {
    await onUpdate(pub.id, input);
    setEditOpen(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete(pub.id);
      setDeleteOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <li className="rounded-xl border border-border/60 bg-card p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{pub.name}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {pub.address} · {pub.neighborhood}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {pub.lat.toFixed(4)}, {pub.lng.toFixed(4)}
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-lg"
              onClick={() => setEditOpen(true)}
            >
              Edit
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="rounded-lg"
              onClick={() => setDeleteOpen(true)}
            >
              Delete
            </Button>
          </div>
        </div>
      </li>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit pub</DialogTitle>
            <DialogDescription>
              Update details for {pub.name}.
            </DialogDescription>
          </DialogHeader>
          <PubForm
            key={pub.id}
            initialValues={{
              name: pub.name,
              address: pub.address,
              neighborhood: pub.neighborhood,
              lat: pub.lat,
              lng: pub.lng,
              imageUrl: pub.imageUrl,
            }}
            submitLabel="Save changes"
            submittingLabel="Saving…"
            onSubmit={handleUpdate}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete pub</DialogTitle>
            <DialogDescription>
              Remove <span className="font-medium text-foreground">{pub.name}</span>?
              This cannot be undone. Deletion may fail if fans are currently checked in
              at this location.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="border-t-0 bg-transparent p-0 pt-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-lg"
              disabled={deleting}
              onClick={() => setDeleteOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="rounded-lg"
              disabled={deleting}
              onClick={() => void handleDelete()}
            >
              {deleting ? "Deleting…" : "Delete pub"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
