import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { message } = await req.json();

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { error: "Message manquant." },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Clé API manquante côté serveur. Vérifie .env.local" },
        { status: 500 }
      );
    }

    const prompt = `
Tu es un expert en communication humaine et en psychologie.

On te donne un message qu'une personne a reçu.
Tu dois :
1) analyser le message (ton, intention, émotion, besoin psychologique, risque de conflit)
2) proposer 3 réponses possibles adaptées.

Structure ta réponse ainsi, en texte simple :

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

Voici le message :
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
                "Tu es un coach en communication sociale, tu connais très bien la psychologie humaine. Tes réponses sont claires, humaines, naturelles.",
            },
            { role: "user", content: prompt },
          ],
          temperature: 0.7,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Erreur Groq:", data);
      const msg = data?.error?.message || "Erreur lors de l'appel à l'IA.";
      return NextResponse.json(
        { error: "Erreur Groq : " + msg },
        { status: 500 }
      );
    }

    if (!data.choices || !data.choices[0]?.message?.content) {
      console.error("Réponse Groq inattendue:", data);
      return NextResponse.json(
        { error: "Réponse Groq inattendue.", raw: data },
        { status: 500 }
      );
    }

    const raw = data.choices[0].message.content;

    // 👉 On ne parse plus, on renvoie juste le texte brut
    return NextResponse.json({ text: raw });
  } catch (err) {
    console.error("Erreur serveur:", err);
    return NextResponse.json(
      { error: "Erreur serveur interne." },
      { status: 500 }
    );
  }
}
