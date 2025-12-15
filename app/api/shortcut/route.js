import { NextResponse } from "next/server";

const STYLE_GUIDE = {
  calme: "Calme, posé, apaisant.",
  pro: "Professionnel, clair, factuel.",
  flirty: "Léger, joueur, subtilement séducteur.",
  direct: "Très concis, direct, sans détour.",
  empathique: "Très empathique, doux, compréhensif.",
  agressif: "Ferme mais respectueux, sans insultes.",
  humour: "Humour léger, détendu, jamais moqueur.",
};

export async function POST(req) {
  try {
    const { message, style } = await req.json();

    if (!message || !message.trim()) {
      return NextResponse.json(
        { error: "Message manquant." },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Clé API manquante côté serveur." },
        { status: 500 }
      );
    }

    const styleText = STYLE_GUIDE[style] || STYLE_GUIDE.calme;

    const prompt = `
Tu es un assistant spécialisé en communication humaine (messages WhatsApp/SMS).

Tu n’es PAS un psy. Tu n’étiquettes pas les gens. Tu aides à répondre de façon simple, humaine et efficace.

STYLE DES RÉPONSES :
${styleText}

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
  ]
}

ANALYSE (ton doux et nuancé) :
- pas de jugement moral
- formulations du type : "ça peut donner l’impression que…", "ça semble traduire…"

RÉPONSES (TRÈS IMPORTANT) :
Tu proposes 3 réponses prêtes à envoyer, qui sonnent HUMAINES.
Règles :
- langage naturel/oral, comme un vrai message
- pas de blabla, pas de jargon, pas de ton thérapeute/coach
- pas de "Je comprends ton ressenti" trop scolaire → préfère des phrases simples
- 1 question maximum par réponse
- 1 à 2 phrases (max ~220 caractères) par réponse
- pas d’insultes, pas d’humiliation, pas de menace

Les 3 réponses doivent être DISTINCTES :
1) "Apaiser + ouvrir" (calme, désamorce)
2) "Sincère + clarifier" (assume un point, explique simplement)
3) "Recadrer doux" (pose une limite, ferme mais respectueux)

Message à analyser :
"""${message}"""
`;

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [
            {
              role: "system",
              content:
                "Tu produis uniquement du JSON valide, strict, sans aucun texte autour.",
            },
            { role: "user", content: prompt },
          ],
          temperature: 0.6,
        }),
      }
    );

    const data = await response.json();

    const raw = data?.choices?.[0]?.message?.content;
    if (!raw) {
      return NextResponse.json(
        { error: "Réponse IA vide ou invalide." },
        { status: 500 }
      );
    }

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      console.error("JSON invalide renvoyé par l'IA :", raw);
      return NextResponse.json(
        { error: "JSON invalide renvoyé par l'IA.", raw },
        { status: 500 }
      );
    }

    if (!parsed?.answers || !Array.isArray(parsed.answers) || parsed.answers.length === 0) {
      return NextResponse.json({ error: "Réponses IA manquantes.", raw }, { status: 500 });
    }
    

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("Erreur serveur :", err);
    return NextResponse.json(
      { error: "Erreur serveur interne." },
      { status: 500 }
    );
  }
}
