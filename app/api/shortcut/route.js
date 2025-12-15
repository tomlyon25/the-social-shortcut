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

    const apiKey = process.env.OPENAI_API_KEY;
    const styleText = STYLE_GUIDE[style] || STYLE_GUIDE.calme;

    const prompt = `
Tu aides à répondre à un message délicat (WhatsApp/SMS).
Tu n’es PAS un psy. Tu n’analyses pas une personne, mais une situation.

FORMAT DE SORTIE :
Retourne UNIQUEMENT un JSON strict.

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

ANALYSE :
- langage doux et nuancé
- jamais de jugement
- formulations type "ça peut donner l’impression que…"

RÉPONSES (TRÈS IMPORTANT) :
- messages prêts à envoyer
- langage oral, humain, imparfait
- pas de ton coach/psy
- 1 à 2 phrases max
- 1 question max
- AU MOINS une réponse avec un marqueur humain naturel
  (ex: "honnêtement", "franchement", "je t’avoue", "ok je vois")

Les 3 réponses doivent être distinctes :
1) Apaiser + ouvrir
2) Sincère + clarifier
3) Recadrer doux

STYLE :
${styleText}

Message :
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
            { role: "system", content: "Tu produis uniquement du JSON valide." },
            { role: "user", content: prompt },
          ],
          temperature: 0.6,
        }),
      }
    );

    const data = await response.json();
    const raw = data.choices[0].message.content;
    const parsed = JSON.parse(raw);

    return NextResponse.json(parsed);
  } catch (err) {
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}
