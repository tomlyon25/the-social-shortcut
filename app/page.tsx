"use client";

import { useMemo, useState } from "react";

type SocialAnalysis = {
  tone: string;
  intention: string;
  emotion: string;
  need: string;
  risk: string;
};

type DatingAnalysis = {
  vibe: string;
  angle: string;
  why_it_works: string;
};

type SocialApiResponse = {
  analysis: SocialAnalysis;
  answers: string[];
  recommended_index?: number;
};

type DatingApiResponse = {
  analysis: DatingAnalysis;
  openers: string[];
  backup_reply: string;
  recommended_index?: number;
};

const SOCIAL_TAGS = ["Apaiser", "Clarifier", "Poser une limite"] as const;
const DATING_TAGS = ["Fun & légère", "Smart & observatrice", "Taquine douce"] as const;

export default function Home() {
  const [mode, setMode] = useState<"social" | "dating">("social");

  // --- Social inputs
  const [message, setMessage] = useState("");
  const [relation, setRelation] = useState("ami");
  const [objective, setObjective] = useState("apaiser");
  const [pronoun, setPronoun] = useState("tu");
  const [length, setLength] = useState("court");
  const [style, setStyle] = useState("calme");

  // --- Dating inputs
  const [profileText, setProfileText] = useState("");
  const [profileContext, setProfileContext] = useState("");
  const [avoidList, setAvoidList] = useState("trop lourd, trop sexualisé, phrases banales");
  const [datingObjective, setDatingObjective] = useState("obtenir_reponse");
  const [datingTone, setDatingTone] = useState("fun");

  // --- UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copyInfo, setCopyInfo] = useState<string | null>(null);

  // --- Results
  const [socialAnalysis, setSocialAnalysis] = useState<SocialAnalysis | null>(null);
  const [socialAnswers, setSocialAnswers] = useState<string[]>([]);
  const [socialRecommended, setSocialRecommended] = useState<number | null>(null);

  const [datingAnalysis, setDatingAnalysis] = useState<DatingAnalysis | null>(null);
  const [datingOpeners, setDatingOpeners] = useState<string[]>([]);
  const [datingBackup, setDatingBackup] = useState<string>("");
  const [datingRecommended, setDatingRecommended] = useState<number | null>(null);

  function resetResults() {
    setError("");
    setCopyInfo(null);

    setSocialAnalysis(null);
    setSocialAnswers([]);
    setSocialRecommended(null);

    setDatingAnalysis(null);
    setDatingOpeners([]);
    setDatingBackup("");
    setDatingRecommended(null);
  }

  function switchMode(next: "social" | "dating") {
    setMode(next);
    resetResults();
  }

  async function handleCopy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopyInfo("Copié ✅");
      setTimeout(() => setCopyInfo(null), 1500);
    } catch {
      setCopyInfo("Impossible 😕");
      setTimeout(() => setCopyInfo(null), 1500);
    }
  }

  const socialAnalysisText = useMemo(() => {
    if (!socialAnalysis) return null;
    const a = socialAnalysis.tone?.trim();
    const b = socialAnalysis.intention?.trim();
    const c = socialAnalysis.emotion?.trim();
    const d = socialAnalysis.need?.trim();
    const e = socialAnalysis.risk?.trim();

    const parts = [
      a ? `À la lecture, ${lowerFirst(a)}` : null,
      b ? `Ça laisse penser que ${lowerFirst(b)}` : null,
      c ? `L’émotion qui ressort le plus : ${lowerFirst(c)}` : null,
      d ? `En dessous, le besoin semble être : ${lowerFirst(d)}` : null,
      e ? `Le piège à éviter : ${lowerFirst(e)}` : null,
    ].filter(Boolean);

    return parts.join(". ") + (parts.length ? "." : "");
  }, [socialAnalysis]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    resetResults();

    setLoading(true);
    try {
      if (mode === "social") {
        if (!message.trim()) {
          setError("Colle un message d'abord 😉");
          return;
        }

        const res = await fetch("/api/shortcut", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message, relation, objective, pronoun, length, style }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Erreur inconnue.");

        const parsed = data as SocialApiResponse;
        setSocialAnalysis(parsed.analysis || null);
        setSocialAnswers(Array.isArray(parsed.answers) ? parsed.answers : []);
        setSocialRecommended(typeof parsed.recommended_index === "number" ? parsed.recommended_index : null);
      } else {
        if (!profileText.trim()) {
          setError("Colle le texte du profil (prompts/bio) 😉");
          return;
        }

        const res = await fetch("/api/dating", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            profileText,
            profileContext,
            avoidList,
            objective: datingObjective,
            tone: datingTone,
            pronoun: "tu",
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Erreur inconnue.");

        const parsed = data as DatingApiResponse;
        setDatingAnalysis(parsed.analysis || null);
        setDatingOpeners(Array.isArray(parsed.openers) ? parsed.openers : []);
        setDatingBackup(parsed.backup_reply || "");
        setDatingRecommended(typeof parsed.recommended_index === "number" ? parsed.recommended_index : null);
      }
    } catch (err: any) {
      setError(err?.message || "Erreur réseau / serveur.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={styles.page}>
      {/* Bouton latéral : FLIRT <-> MESSAGES */}
      <button
        type="button"
        onClick={() => switchMode(mode === "social" ? "dating" : "social")}
        style={styles.sideBtn}
        aria-label={mode === "social" ? "Aller au mode Flirt" : "Revenir au mode Messages"}
        title={mode === "social" ? "Mode FLIRT" : "Mode MESSAGES"}
      >
        {mode === "social" ? "FLIRT" : "MESSAGES"}
      </button>

      <div style={styles.shell}>
        <header style={styles.header}>
          <div style={styles.pill}>● Assistant social IA</div>
          <h1 style={styles.h1}>The Social Shortcut</h1>
          <p style={styles.subtitle}>
            {mode === "social"
              ? "Colle un message délicat → 3 réponses humaines prêtes à envoyer."
              : "Colle le texte du profil → 3 accroches fun prêtes à envoyer."}
          </p>
        </header>

        <form onSubmit={handleSubmit} style={styles.card}>
          {mode === "social" ? (
            <>
              <label style={styles.label}>Message reçu</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Colle le message reçu…"
                rows={4}
                style={styles.textarea}
              />

              <div style={styles.grid2}>
                <div>
                  <label style={styles.label}>Relation</label>
                  <select value={relation} onChange={(e) => setRelation(e.target.value)} style={styles.select}>
                    <option value="ami">Ami / proche</option>
                    <option value="couple">Couple</option>
                    <option value="ex">Ex</option>
                    <option value="collegue">Collègue</option>
                    <option value="manager">Manager</option>
                    <option value="client">Client</option>
                  </select>
                </div>

                <div>
                  <label style={styles.label}>Objectif</label>
                  <select value={objective} onChange={(e) => setObjective(e.target.value)} style={styles.select}>
                    <option value="apaiser">Apaiser</option>
                    <option value="clarifier">Clarifier</option>
                    <option value="recadrer">Poser une limite</option>
                    <option value="refuser">Refuser</option>
                    <option value="relancer">Relancer</option>
                    <option value="conclure">Clore</option>
                  </select>
                </div>

                <div>
                  <label style={styles.label}>Tu / Vous</label>
                  <select value={pronoun} onChange={(e) => setPronoun(e.target.value)} style={styles.select}>
                    <option value="tu">Tu</option>
                    <option value="vous">Vous</option>
                  </select>
                </div>

                <div>
                  <label style={styles.label}>Longueur</label>
                  <select value={length} onChange={(e) => setLength(e.target.value)} style={styles.select}>
                    <option value="court">Court (SMS)</option>
                    <option value="normal">Normal (WhatsApp)</option>
                  </select>
                </div>

                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={styles.label}>Style</label>
                  <select value={style} onChange={(e) => setStyle(e.target.value)} style={styles.select}>
                    <option value="calme">Calme</option>
                    <option value="pro">Professionnel</option>
                    <option value="empathique">Empathique</option>
                    <option value="direct">Direct</option>
                    <option value="flirty">Flirty</option>
                    <option value="humour">Humour</option>
                    <option value="agressif">Agressif soft</option>
                  </select>
                </div>
              </div>
            </>
          ) : (
            <>
              <label style={styles.label}>Texte du profil (Hinge prompts, bio, etc.)</label>
              <textarea
                value={profileText}
                onChange={(e) => setProfileText(e.target.value)}
                placeholder="Colle ici la bio + prompts du profil…"
                rows={5}
                style={styles.textarea}
              />

              <label style={{ ...styles.label, marginTop: 10 }}>Éléments visibles (2–5 détails)</label>
              <textarea
                value={profileContext}
                onChange={(e) => setProfileContext(e.target.value)}
                placeholder='Ex: "photo rando, chien, voyage Lisbonne, humour second degré, fan de sushi"'
                rows={3}
                style={styles.textarea}
              />

              <div style={styles.grid2}>
                <div>
                  <label style={styles.label}>Objectif</label>
                  <select value={datingObjective} onChange={(e) => setDatingObjective(e.target.value)} style={styles.select}>
                    <option value="obtenir_reponse">Obtenir une réponse</option>
                    <option value="rebond_prompt">Rebondir sur un prompt</option>
                    <option value="proposer_date">Proposer un date léger</option>
                    <option value="relancer">Relancer après réponse courte</option>
                  </select>
                </div>

                <div>
                  <label style={styles.label}>Ton</label>
                  <select value={datingTone} onChange={(e) => setDatingTone(e.target.value)} style={styles.select}>
                    <option value="fun">Fun</option>
                    <option value="elegant">Élégant</option>
                    <option value="direct">Direct</option>
                  </select>
                </div>

                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={styles.label}>À éviter</label>
                  <input
                    value={avoidList}
                    onChange={(e) => setAvoidList(e.target.value)}
                    placeholder="Ex: trop lourd, trop sexualisé, trop cliché"
                    style={styles.input}
                  />
                </div>
              </div>
            </>
          )}

          <button type="submit" disabled={loading} style={styles.btn}>
            {loading ? "Génération…" : mode === "social" ? "Analyser & proposer" : "Créer 3 accroches"}
          </button>

          {error && <div style={styles.error}>{error}</div>}
          {copyInfo && <div style={styles.ok}>{copyInfo}</div>}
        </form>

        {/* RESULTS */}
        <div style={styles.results}>
          {mode === "social" && socialAnalysis && (
            <section style={styles.resultCard}>
              <h2 style={styles.h2}>Lecture du message</h2>
              {socialAnalysisText && <p style={styles.p}>{socialAnalysisText}</p>}
            </section>
          )}

          {mode === "social" && socialAnswers.length > 0 && (
            <section style={styles.resultCard}>
              <h2 style={styles.h2}>Réponses possibles</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
                {socialAnswers.map((rep, i) => {
                  const rec = socialRecommended === i;
                  return (
                    <div
                      key={i}
                      style={{
                        ...styles.answerBox,
                        borderColor: rec ? "rgba(34,197,94,0.45)" : "#1f2937",
                      }}
                    >
                      <div style={styles.answerTop}>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <span style={styles.mini}>Option {i + 1}</span>
                          <span style={styles.tag}>{SOCIAL_TAGS[i] ?? "Réponse"}</span>
                          {rec && <span style={styles.rec}>Recommandée</span>}
                        </div>
                        <button type="button" onClick={() => handleCopy(rep)} style={styles.copy}>
                          Copier
                        </button>
                      </div>
                      <p style={styles.answerP}>{rep}</p>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {mode === "dating" && datingAnalysis && (
            <section style={styles.resultCard}>
              <h2 style={styles.h2}>Lecture du profil</h2>
              <p style={styles.p}>
                <b>Vibe :</b> {datingAnalysis.vibe}
              </p>
              <p style={styles.p}>
                <b>Angle :</b> {datingAnalysis.angle}
              </p>
              <p style={styles.p}>
                <b>Pourquoi ça marche :</b> {datingAnalysis.why_it_works}
              </p>
            </section>
          )}

          {mode === "dating" && datingOpeners.length > 0 && (
            <section style={styles.resultCard}>
              <h2 style={styles.h2}>Accroches prêtes à envoyer</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
                {datingOpeners.map((rep, i) => {
                  const rec = datingRecommended === i;
                  return (
                    <div
                      key={i}
                      style={{
                        ...styles.answerBox,
                        borderColor: rec ? "rgba(34,197,94,0.45)" : "#1f2937",
                      }}
                    >
                      <div style={styles.answerTop}>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <span style={styles.mini}>Option {i + 1}</span>
                          <span style={styles.tag}>{DATING_TAGS[i] ?? "Accroche"}</span>
                          {rec && <span style={styles.rec}>Recommandée</span>}
                        </div>
                        <button type="button" onClick={() => handleCopy(rep)} style={styles.copy}>
                          Copier
                        </button>
                      </div>
                      <p style={styles.answerP}>{rep}</p>
                    </div>
                  );
                })}
              </div>

              {datingBackup && (
                <div style={{ ...styles.answerBox, marginTop: 14 }}>
                  <div style={styles.answerTop}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={styles.mini}>Plan B</span>
                      <span style={styles.tag}>Si elle répond “haha”</span>
                    </div>
                    <button type="button" onClick={() => handleCopy(datingBackup)} style={styles.copy}>
                      Copier
                    </button>
                  </div>
                  <p style={styles.answerP}>{datingBackup}</p>
                </div>
              )}
            </section>
          )}
        </div>

        <footer style={{ marginTop: 16, fontSize: 11, opacity: 0.55, textAlign: "right" }}>
          Prototype — adapte avec ton jugement.
        </footer>
      </div>
    </main>
  );
}

function lowerFirst(s: string) {
  if (!s) return s;
  return s.charAt(0).toLowerCase() + s.slice(1);
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    padding: 16,
    display: "flex",
    justifyContent: "center",
    background: "radial-gradient(circle at top, #1e293b 0, #020617 55%, #000 100%)",
    color: "white",
    position: "relative",
  },
  shell: { width: "100%", maxWidth: 900 },
  header: { marginBottom: 14 },
  pill: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "4px 10px",
    borderRadius: 999,
    background: "rgba(56,189,248,0.10)",
    border: "1px solid rgba(56,189,248,0.25)",
    fontSize: 11,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#7dd3fc",
  },
  h1: { margin: "10px 0 6px", fontSize: 26, fontWeight: 650 },
  subtitle: { margin: 0, fontSize: 14, opacity: 0.78 },

  sideBtn: {
    position: "fixed",
    right: 14,
    top: "50%",
    transform: "translateY(-50%)",
    padding: "12px 14px",
    borderRadius: 999,
    border: "1px solid rgba(148,163,184,0.35)",
    background: "rgba(148,163,184,0.14)",
    color: "white",
    fontWeight: 900,
    letterSpacing: "0.14em",
    cursor: "pointer",
    zIndex: 50,
    backdropFilter: "blur(8px)",
  },

  card: {
    background: "rgba(15,23,42,0.95)",
    border: "1px solid #1e293b",
    borderRadius: 24,
    padding: 18,
    boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
  },
  label: { display: "block", fontSize: 12, opacity: 0.8, marginBottom: 6 },
  textarea: {
    width: "100%",
    padding: 12,
    borderRadius: 12,
    border: "1px solid #1f2937",
    background: "#020617",
    color: "white",
    resize: "vertical",
    fontSize: 14,
  },
  input: {
    width: "100%",
    padding: 10,
    borderRadius: 999,
    border: "1px solid #1f2937",
    background: "#020617",
    color: "white",
    fontSize: 13,
  },
  select: {
    width: "100%",
    padding: 10,
    borderRadius: 999,
    border: "1px solid #1f2937",
    background: "#020617",
    color: "white",
    fontSize: 13,
  },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 },
  btn: {
    marginTop: 12,
    width: "100%",
    padding: 12,
    borderRadius: 999,
    border: "none",
    background: "linear-gradient(90deg,#38bdf8,#22c55e)",
    color: "black",
    fontWeight: 800,
    cursor: "pointer",
  },
  error: { marginTop: 12, padding: 10, borderRadius: 12, background: "#7f1d1d", fontSize: 13 },
  ok: {
    marginTop: 12,
    padding: 10,
    borderRadius: 12,
    background: "rgba(34,197,94,0.12)",
    border: "1px solid rgba(34,197,94,0.25)",
    fontSize: 13,
    color: "#bbf7d0",
  },
  results: { marginTop: 14, display: "grid", gap: 12 },
  resultCard: {
    padding: 14,
    borderRadius: 16,
    background: "rgba(2,6,23,0.55)",
    border: "1px solid #1f2937",
  },
  h2: { margin: 0, fontSize: 15, fontWeight: 800, opacity: 0.95 },
  p: { margin: "10px 0 0", opacity: 0.88, lineHeight: 1.55, fontSize: 14 },
  answerBox: { padding: 12, borderRadius: 14, background: "#020617", border: "1px solid #1f2937" },
  answerTop: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 },
  mini: { fontSize: 11, opacity: 0.7, textTransform: "uppercase", letterSpacing: "0.08em" },
  tag: {
    fontSize: 11,
    padding: "3px 8px",
    borderRadius: 999,
    background: "rgba(148,163,184,0.15)",
    border: "1px solid rgba(148,163,184,0.35)",
    whiteSpace: "nowrap",
  },
  rec: {
    fontSize: 11,
    padding: "3px 8px",
    borderRadius: 999,
    background: "rgba(34,197,94,0.16)",
    border: "1px solid rgba(34,197,94,0.35)",
    whiteSpace: "nowrap",
  },
  copy: {
    border: "none",
    borderRadius: 999,
    padding: "6px 10px",
    background: "rgba(148,163,184,0.15)",
    color: "white",
    cursor: "pointer",
    fontSize: 12,
  },
  answerP: { margin: "10px 0 0", fontSize: 14, lineHeight: 1.55, opacity: 0.95 },
};
