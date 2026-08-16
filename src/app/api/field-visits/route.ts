import { NextResponse } from "next/server";
import { structureFieldNotesWithPioneer } from "@/lib/pioneer/structure-notes";
import { createFieldVisit } from "@/lib/partner/store";
import { requireAuthUser } from "@/lib/auth/require-user";

function cleanPioneerLabel(value: string | undefined): string {
  if (!value) return "";
  return value.replace(/^(Pub|Address|Neighborhood|Contact):\s*/i, "").trim();
}

/** Public field-worker submit — auth optional; if logged in we attach email. */
export async function POST(request: Request) {
  try {
    let workerEmail: string | undefined;
    let workerName = "Terac field worker";
    try {
      const user = await requireAuthUser();
      workerEmail = user.email;
      workerName = user.email?.split("@")[0] || workerName;
    } catch {
      // allow unauthenticated Terac submissions with explicit worker fields
    }

    const body = (await request.json()) as {
      workerName?: string;
      workerEmail?: string;
      pubName?: string;
      address?: string;
      neighborhood?: string;
      contactName?: string;
      contactPhone?: string;
      contactEmail?: string;
      outcome?: "interested" | "not_interested" | "follow_up";
      notes?: string;
      photoUrl?: string;
    };

    const notes = body.notes?.trim() || "";
    const pubName = body.pubName?.trim() || "";
    if (!pubName && !notes) {
      return NextResponse.json(
        { error: "pubName or notes required" },
        { status: 400 },
      );
    }

    const pioneer = await structureFieldNotesWithPioneer(
      [
        `Pub: ${pubName || "(from notes)"}`,
        `Address: ${body.address || ""}`,
        `Neighborhood: ${body.neighborhood || ""}`,
        `Contact: ${body.contactName || ""} ${body.contactPhone || ""}`,
        `Outcome: ${body.outcome || "follow_up"}`,
        notes,
      ].join("\n"),
    );

    // Prefer explicit form fields so admin sees what Terac typed.
    const visit = await createFieldVisit({
      workerName: body.workerName?.trim() || workerName,
      workerEmail: body.workerEmail?.trim() || workerEmail,
      pubName: pubName || cleanPioneerLabel(pioneer.pubName),
      address: body.address?.trim() || pioneer.address,
      neighborhood: body.neighborhood?.trim() || pioneer.neighborhood,
      contactName: body.contactName?.trim() || pioneer.contactName,
      contactPhone: body.contactPhone?.trim(),
      contactEmail: body.contactEmail?.trim(),
      outcome:
        body.outcome ||
        (pioneer.interested ? "interested" : "not_interested"),
      notes:
        notes ||
        [
          body.address && `Address: ${body.address}`,
          body.neighborhood && `Neighborhood: ${body.neighborhood}`,
          body.contactName &&
            `Contact: ${body.contactName} ${body.contactPhone || ""}`.trim(),
        ]
          .filter(Boolean)
          .join("\n"),
      photoUrl: body.photoUrl,
      pioneerJson: pioneer as unknown as Record<string, unknown>,
    });

    return NextResponse.json({ visit, pioneer });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Submit failed" },
      { status: 500 },
    );
  }
}
