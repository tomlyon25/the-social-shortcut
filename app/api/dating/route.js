import { NextResponse } from "next/server";

/**
 * Utilitaires
 */
function jsonError(message, status = 500, extra = {}) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

async function groqChat(apiKey, messages, temperature = 0.6) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages,
      temperature,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    const msg = data?.error?.message || "Erreur lors de l'appel à l'IA.";
    throw new Error(msg);
  }

  const raw = data?.choices?.[0]?.message?.content;
  if (!raw) throw new Error("Réponse IA vide.");

  return raw;
}

/**
 * Guides de ton / objectif
 */
const TONE_GUIDE = {
  fun: "fun, léger, spontané, confiant mais détendu",
  elegant: "élégant, sobre, charmant, jamais lourd",
  direct: "direct, simple, efficace, sans être sec",
};

const OBJECTIVE_GUIDE = {
  obtenir_reponse: "donner envie de répondre",
  rebond_prompt: "rebondir intelligemment sur un prompt du profil",
  proposer_date: "amener une proposition de date légère, sans forcer",
  relancer: "relancer après une réponse courte (haha, lol, 😅)",
};

/**
 * Route POST
 */
export async function POST(req) {
  try {
    const body = await req.json();

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return jsonError("Clé API manquante côté serveur.", 500);

    const profileText = (body?.profileText || "").trim();
    const profileContext = (body?.profileContext || "").trim();
    const avoidList = (body?.avoidList || "").trim();
    const tone = body?.tone || "fun";
    const objective = body?.objective || "obtenir_reponse";

    if (!profileText) {
      return jsonError("profileText manquant.", 400);
    }

    const toneText = TONE_GUIDE[tone] || TONE_GUIDE.fun;
    const objectiveText = OBJECTIVE_GUIDE[objective] || OBJECTIVE_GUIDE.obtenir_reponse;

    const prompt = `
Tu es un expert en conversations sur les apps de rencontre (Hinge, Tinder, Bumble).

CONTEXTE :
- Tutoiement obligatoire
- Ton : ${toneText}
- Objectif : ${objectiveText}

RÈGLES ABSOLUES :
- Pas de compliments génériques
- Pas de phrases vues mille fois
- Pas de sexualisation
- Pas de "salut ça va"
- 1 emoji max (optionnel)
- 1 question max par phrase
- Phrases courtes, prêtes à envoyer

IMPORTANT :
Tu dois TOUJOURS rebondir sur un détail précis du profil.
Tu dois écrire comme un humain normal, pas comme une IA.

FORMAT DE SORTIE (OBLIGATOIRE) :
Retourne UNIQUEMENT un JSON strict, sans texte autour.

Format EXACT :
{
  "analysis": {
    "vibe": "...",
    "angle": "...",
    "why_it_works": "..."
  },
  "openers": [
    "...",
    "...",
    "..."
  ],
  "backup_reply": "...",
  "recommended_index": 0
}

Contraintes supplémentaires :
- 3 openers maximum
- Chaque opener doit avoir une personnalité différente
- AU MOINS une opener doit contenir un marqueur humain naturel
  (ex: "honnêtement", "je t’avoue", "ok je vois")

Voici le texte du profil :
"""${profileText}"""

Éléments visibles / contexte :
"""${profileContext || "(non précisé)"}"""

À éviter absolument :
"""${avoidList || "(rien de spécial)"}"""
`;

    const messages = [
      {
        role: "system",
        content: "Tu produis uniquement du JSON valide. Aucun texte autour.",
      },
      { role: "user", content: prompt },
    ];

    let raw = await groqChat(apiKey, messages, 0.65);

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      // Tentative de réparation JSON
      const fixMessages = [
        {
          role: "system",
          content:
            "Tu es un correcteur JSON. Tu renvoies uniquement un JSON valide strict.",
        },
        {
          role: "user",
          content: `Corrige ce contenu pour qu'il respecte exactement le format JSON attendu, sans rien ajouter :\n${raw}`,
        },
      ];

      const fixed = await groqChat(apiKey, fixMessages, 0.2);
      try {
        parsed = JSON.parse(fixed);
      } catch {
        return jsonError("JSON invalide renvoyé par l'IA.", 500, { raw });
      }
    }

    /**
     * 🔒 NORMALISATION CRITIQUE
     * On force openers à être un tableau de strings
     */
    parsed.openers = (Array.isArray(parsed.openers) ? parsed.openers : [])
      .map((o) => {
        if (typeof o === "string") return o.trim();
        if (o && typeof o === "object") {
          const v = Object.values(o)[0];
          return typeof v === "string" ? v.trim() : String(v || "").trim();
        }
        return String(o || "").trim();
      })
      .filter(Boolean)
      .slice(0, 3);

    if (!parsed.analysis || !Array.isArray(parsed.openers)) {
      return jsonError("Structure IA inattendue.", 500, { raw });
    }

    if (!parsed.backup_reply || typeof parsed.backup_reply !== "string") {
      parsed.backup_reply =
        "Ok je vois 😄 et du coup, sur ton profil j’ai une question : c’est quoi ton truc préféré là-dedans ?";
    }

    if (
      typeof parsed.recommended_index !== "number" ||
      parsed.recommended_index < 0 ||
      parsed.recommended_index > parsed.openers.length - 1
    ) {
      parsed.recommended_index = 0;
    }

    return NextResponse.json(parsed);
  } catch (err) {
    return NextResponse.json(
      { error: err?.message || "Erreur serveur interne." },
      { status: 500 }
    );
  }
}
