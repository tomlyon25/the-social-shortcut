import { NextResponse } from "next/server";

const STYLE_GUIDE = {
  calme:
    "Réponds calmement, posé, avec une intention d’apaisement. Pas de tension, pas de sarcasme.",
  pro:
    "Réponds de façon professionnelle : poli, clair, factuel, sans émotion excessive.",
  flirty:
    "Réponds avec une touche légère et joueuse (flirt subtil), jamais vulgaire, jamais explicite.",
  direct:
    "Réponds de manière très concise, directe, sans blabla. 1 à 2 phrases max.",
  empathique:
    "Réponds avec beaucoup d’empathie et de compréhension. Valide l’émotion de l’autre tout en posant des limites.",
  agressif:
    "Réponds de manière ferme et piquante, mais sans insultes, sans violence, sans humiliations. Franc, cadré.",
  humour:
    "Réponds avec humour léger, sans se moquer de la personne, et sans sarcasme agressif.",
  seduction:
    "Réponds avec confiance et séduction subtile, élégante, sans contenu explicite.",
};

function clampStyle(style) {
  if (!style) return "calme";
  return STYLE_GUIDE[style] ? style : "calme";
}

export async function POST(req) {
  try {
    const { message, style } = await req.json();

    if (!message || message.trim().length === 0) {
      return NextResponse.json({ error: "Message manquant." }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Clé API manquante côté serveur. Vérifie .env.local (ou Vercel env)." },
        { status: 500 }
      );
    }

    const safeStyle = clampStyle(style);
    const styleInstruction = STYLE_GUIDE[safeStyle];

    const prompt = `
Tu es un expert en communication humaine et en psychologie.

IMPORTANT : Le style demandé pour les réponses est :
"${styleInstruction}"

Ta mission :
1) analyser le message (ton, intention, émotion dominante, besoin psychologique, risque)
2) proposer 3 réponses adaptées au STYLE demandé.

Contraintes de format (OBLIGATOIRE) :
- Réponds en FRANÇAIS.
- Respecte EXACTEMENT cette structure et ces libellés :
ANALYSE :
- Ton : ...
- Intention : ...
- Émotion dominante : ...
- Besoin psychologique : ...
- Risque : ...

RÉPONSES PROPOSÉES :
1) ...
2) ...
3) ...

Contraintes de qualité :
- Les réponses doivent être naturelles, humaines.
- Pas de jargon, pas d’explication sur ta méthode.
- Pas de contenu haineux, insultant, ou menaçant.

Voici le message :
"""${message}"""
`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
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
              "Tu es un coach en communication sociale. Tu écris des réponses courtes, naturelles, adaptées au contexte.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Erreur Groq:", data);
      const msg = data?.error?.message || "Erreur lors de l'appel à l'IA.";
      return NextResponse.json({ error: "Erreur Groq : " + msg }, { status: 500 });
    }

    if (!data.choices || !data.choices[0]?.message?.content) {
      console.error("Réponse Groq inattendue:", data);
      return NextResponse.json(
        { error: "Réponse Groq inattendue.", raw: data },
        { status: 500 }
      );
    }

    const raw = data.choices[0].message.content;

    // On renvoie le texte brut (ton front parse ANALYSE / RÉPONSES)
    return NextResponse.json({ text: raw });
  } catch (err) {
    console.error("Erreur serveur:", err);
    return NextResponse.json({ error: "Erreur serveur interne." }, { status: 500 });
  }
}
