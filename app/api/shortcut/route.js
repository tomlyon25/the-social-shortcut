import { NextResponse } from "next/server";

const STYLE_GUIDE = {
  calme: "Calme, posé, apaisant.",
  pro: "Professionnel, clair, factuel.",
  flirty: "Léger, joueur, subtilement séducteur (reste sobre).",
  direct: "Très concis, direct, sans détour.",
  empathique: "Très empathique, doux, compréhensif.",
  agressif: "Ferme mais respectueux, sans insultes.",
  humour: "Humour léger, détendu, jamais moqueur.",
};

const RELATION_GUIDE = {
  ami: "ami/proche (très naturel, simple, sans chichi)",
  couple: "couple (affectif, attention aux blessures, privilégie la réparation)",
  ex: "ex (neutre, prudent, limites claires, pas de sur-émotion)",
  collegue: "collègue (cordial, pro, pas trop intime)",
  manager: "manager (respectueux, clair, factuel, pas familier)",
  client: "client (très pro, poli, orienté solution)",
};

const OBJECTIVE_GUIDE = {
  apaiser: "désamorcer et apaiser la tension",
  clarifier: "clarifier un malentendu ou un point concret",
  recadrer: "poser une limite calmement (sans agressivité)",
  refuser: "refuser proprement sans créer de conflit",
  relancer: "relancer de manière simple et efficace",
  conclure: "clore la discussion proprement",
};

const LENGTH_GUIDE = {
  court: "court : 1–2 phrases max (~220 caractères), très WhatsApp/SMS",
  normal: "normal : 2–3 phrases, toujours naturel et envoyable",
};

function jsonError(msg, status = 500, extra = {}) {
  return NextResponse.json({ error: msg, ...extra }, { status });
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

export async function POST(req) {
  try {
    const body = await req.json();
    const message = (body?.message || "").trim();
    const style = body?.style || "calme";
    const relation = body?.relation || "ami";
    const objective = body?.objective || "apaiser";
    const pronoun = body?.pronoun || "tu"; // tu | vous
    const length = body?.length || "court"; // court | normal

    if (!message) return jsonError("Message manquant.", 400);

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return jsonError("Clé API manquante côté serveur.", 500);

    const styleText = STYLE_GUIDE[style] || STYLE_GUIDE.calme;
    const relationText = RELATION_GUIDE[relation] || RELATION_GUIDE.ami;
    const objectiveText = OBJECTIVE_GUIDE[objective] || OBJECTIVE_GUIDE.apaiser;
    const lengthText = LENGTH_GUIDE[length] || LENGTH_GUIDE.court;

    const prompt = `
Tu aides à répondre à un message délicat (WhatsApp/SMS).
Tu n’es PAS un psy. Tu n’étiquettes pas les gens. Tu aides à répondre de façon simple, humaine et efficace.

CONTRAINTE DE PRONOMS :
- Tu dois écrire les réponses en ${pronoun === "vous" ? "vouvoiement (vous)" : "tutoiement (tu)"}.

CONTEXTE RELATIONNEL :
- La personne en face est : ${relationText}.
- Adapte le niveau de familiarité et les limites à ce contexte.

OBJECTIF :
- L’objectif principal est : ${objectiveText}.

STYLE :
- ${styleText}

LONGUEUR :
- ${lengthText}

FORMAT DE SORTIE (OBLIGATOIRE) :
Retourne UNIQUEMENT un JSON strict, sans texte autour, sans markdown.

Format EXACT attendu :
{
  "analysis": {
    "tone": "...",
    "intention": "...",
    "emotion": "...",
    "need": "...",
    "risk": "..."
  },
  "answers": [
    "...",
    "...",
    "..."
  ],
  "recommended_index": 0
}

ANALYSE :
- langage doux et nuancé
- jamais de jugement moral
- formulations type : "ça peut donner l’impression que…", "ça semble traduire…"
- "risk" doit être concret et orienté usage : "le risque, c’est que…"

RÉPONSES (TRÈS IMPORTANT) :
- Messages prêts à envoyer
- Langage oral, humain, imparfait (vrai WhatsApp)
- Évite le ton coach/psy et les formules scolaires ("Je comprends ton ressenti" etc.)
- 1 question maximum par réponse
- pas d’insultes, pas d’humiliation, pas de menace
- AU MOINS une réponse contient un marqueur humain naturel (ex: "honnêtement", "franchement", "je t’avoue", "ok je vois")
- Les 3 réponses doivent être DISTINCTES :
  1) Apaiser + ouvrir
  2) Sincère + clarifier
  3) Recadrer doux

RECOMMANDATION :
- Mets "recommended_index" sur l’option la plus sûre et la plus efficace pour l’objectif (0, 1 ou 2).

Message :
"""${message}"""
`;

    const messages = [
      { role: "system", content: "Tu produis uniquement du JSON valide et strict. Aucun texte autour." },
      { role: "user", content: prompt },
    ];

    let raw = await groqChat(apiKey, messages, 0.6);

    // Parse JSON (avec mini fallback réparation si besoin)
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      // tentative de réparation
      const fixMessages = [
        { role: "system", content: "Tu répares du JSON. Tu renvoies uniquement du JSON valide, strict." },
        {
          role: "user",
          content: `Répare ce contenu en JSON strict au format demandé, sans rien ajouter. Contenu:\n${raw}`,
        },
      ];
      const fixed = await groqChat(apiKey, fixMessages, 0.2);
      try {
        parsed = JSON.parse(fixed);
      } catch {
        return jsonError("JSON invalide renvoyé par l'IA.", 500, { raw });
      }
    }

    // Garde-fous
    if (!parsed?.analysis || !Array.isArray(parsed?.answers)) {
      return jsonError("Réponse IA inattendue.", 500, { raw });
    }
    if (parsed.answers.length === 0) {
      return jsonError("Réponses IA manquantes.", 500, { raw });
    }
    if (typeof parsed.recommended_index !== "number" || parsed.recommended_index < 0 || parsed.recommended_index > 2) {
      parsed.recommended_index = 0;
    }

    // Normalise réponses (max 3)
    parsed.answers = parsed.answers.slice(0, 3);

    return NextResponse.json(parsed);
  } catch (err) {
    return NextResponse.json({ error: err?.message || "Erreur serveur interne." }, { status: 500 });
  }
}
