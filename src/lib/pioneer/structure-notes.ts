const PIONEER_URL = "https://api.pioneer.ai";

export interface StructuredPubDraft {
  pubName: string;
  address: string;
  neighborhood: string;
  interested: boolean;
  screeningMatches: string[];
  rewards: Array<{ title: string; value: string; description?: string }>;
  couponsPerDay: number;
  contactName: string;
  notes: string;
}

export async function structureFieldNotesWithPioneer(
  rawNotes: string,
): Promise<StructuredPubDraft> {
  const apiKey = process.env.PIONEER_API_KEY;
  if (!apiKey) {
    return fallbackStructure(rawNotes);
  }

  try {
    const response = await fetch(`${PIONEER_URL}/inference`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
      body: JSON.stringify({
        base_model: "fastino/gliner2-base-v1",
        inputs: [
          {
            text: rawNotes,
            labels: [
              "pub_name",
              "address",
              "neighborhood",
              "contact_name",
              "reward",
              "match",
              "coupons_per_day",
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      // Try OpenAI-compatible generate path
      const gen = await fetch(`${PIONEER_URL}/v1/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": apiKey,
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "pioneer-default",
          messages: [
            {
              role: "system",
              content:
                "Extract LocalDerby pub onboarding data. Reply ONLY with JSON: {pubName,address,neighborhood,interested,screeningMatches,rewards:[{title,value,description}],couponsPerDay,contactName,notes}",
            },
            { role: "user", content: rawNotes },
          ],
          temperature: 0,
        }),
      });
      if (gen.ok) {
        const payload = (await gen.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        const content = payload.choices?.[0]?.message?.content ?? "";
        const parsed = extractJson(content);
        if (parsed) return normalizeDraft(parsed, rawNotes);
      }
      return fallbackStructure(rawNotes);
    }

    const payload = (await response.json()) as {
      entities?: Array<{ label?: string; text?: string }>;
      results?: Array<{ entities?: Array<{ label?: string; text?: string }> }>;
    };
    const entities =
      payload.entities ??
      payload.results?.[0]?.entities ??
      [];
    return entitiesToDraft(entities, rawNotes);
  } catch {
    return fallbackStructure(rawNotes);
  }
}

function entitiesToDraft(
  entities: Array<{ label?: string; text?: string }>,
  raw: string,
): StructuredPubDraft {
  const by = (label: string) =>
    entities
      .filter((e) => e.label === label && e.text)
      .map((e) => String(e.text).trim());

  const rewards = by("reward").map((text) => ({
    title: text,
    value: text.includes("$") ? text : "$5",
    description: text,
  }));

  const couponsRaw = by("coupons_per_day")[0];
  const couponsPerDay = Number.parseInt(couponsRaw ?? "20", 10);

  return normalizeDraft(
    {
      pubName: by("pub_name")[0],
      address: by("address")[0],
      neighborhood: by("neighborhood")[0],
      interested: /interest/i.test(raw) && !/not interest/i.test(raw),
      screeningMatches: by("match"),
      rewards,
      couponsPerDay: Number.isFinite(couponsPerDay) ? couponsPerDay : 20,
      contactName: by("contact_name")[0],
      notes: raw,
    },
    raw,
  );
}

function extractJson(content: string): Record<string, unknown> | null {
  const match = content.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function normalizeDraft(
  raw: Record<string, unknown>,
  fallbackNotes: string,
): StructuredPubDraft {
  const rewardsRaw = Array.isArray(raw.rewards) ? raw.rewards : [];
  return {
    pubName: String(raw.pubName ?? raw.pub_name ?? "Unknown pub"),
    address: String(raw.address ?? ""),
    neighborhood: String(raw.neighborhood ?? ""),
    interested: Boolean(raw.interested ?? true),
    screeningMatches: Array.isArray(raw.screeningMatches)
      ? raw.screeningMatches.map(String)
      : Array.isArray(raw.screening_matches)
        ? (raw.screening_matches as unknown[]).map(String)
        : [],
    rewards: rewardsRaw.map((item) => {
      const row = item as Record<string, unknown>;
      return {
        title: String(row.title ?? "Pub reward"),
        value: String(row.value ?? "$5"),
        description: String(row.description ?? ""),
      };
    }),
    couponsPerDay: Number(raw.couponsPerDay ?? raw.coupons_per_day ?? 20) || 20,
    contactName: String(raw.contactName ?? raw.contact_name ?? ""),
    notes: String(raw.notes ?? fallbackNotes),
  };
}

function fallbackStructure(rawNotes: string): StructuredPubDraft {
  const lines = rawNotes
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  return {
    pubName: lines[0] || "SF pub (from field notes)",
    address: lines.find((l) => /\d/.test(l)) || "",
    neighborhood: "",
    interested: !/not interested/i.test(rawNotes),
    screeningMatches: [],
    rewards: [{ title: "$5 off", value: "$5", description: "LocalDerby fan reward" }],
    couponsPerDay: 20,
    contactName: "",
    notes: rawNotes,
  };
}
