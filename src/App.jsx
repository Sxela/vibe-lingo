import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Plus, RefreshCw, RotateCcw, Save, Trash2, Upload } from "lucide-react";

/**
 * ChillCards — a lightweight, local-first, no-pressure language card app.
 */

/** @typedef {{ id: string; term: string; translation: string; hint?: string }} CardItem */
/** @typedef {{ correct: number; wrong: number; lastSeen?: number }} Stat */
/** @typedef {{ id: string; pronoun: string; verbForm: string; note?: string }} GrammarPair */

const DEFAULT_CARDS = /** @type {CardItem[]} */ ([
  { id: "1", term: "bonjour", translation: "hello", hint: "greeting" },
  { id: "2", term: "merci", translation: "thank you" },
  { id: "3", term: "s'il vous plaît", translation: "please" },
  { id: "4", term: "pomme", translation: "apple" },
  { id: "5", term: "manger", translation: "to eat" },
]);

const DEFAULT_PAIRS = /** @type {GrammarPair[]} */ ([
  { id: "gp1", pronoun: "je", verbForm: "mange", note: "-er verbs drop -r, add -e" },
  { id: "gp2", pronoun: "tu", verbForm: "manges", note: "informal singular" },
  { id: "gp3", pronoun: "il/elle/on", verbForm: "mange" },
  { id: "gp4", pronoun: "nous", verbForm: "mangeons", note: "keep 'e' before -ons" },
  { id: "gp5", pronoun: "vous", verbForm: "mangez", note: "formal / plural" },
  { id: "gp6", pronoun: "ils/elles", verbForm: "mangent" },
]);

const LS_KEYS = {
  cards: "chillcards.cards",
  grammar: "chillcards.grammarPairs",
  stats: "chillcards.statsById",
  options: "chillcards.options",
};

function loadCards() {
  const raw = localStorage.getItem(LS_KEYS.cards);
  return raw ? JSON.parse(raw) : DEFAULT_CARDS;
}
function saveCards(cards) {
  localStorage.setItem(LS_KEYS.cards, JSON.stringify(cards));
}
function loadStats() {
  const raw = localStorage.getItem(LS_KEYS.stats);
  return raw ? JSON.parse(raw) : {};
}
function saveStats(stats) {
  localStorage.setItem(LS_KEYS.stats, JSON.stringify(stats));
}
function loadPairs() {
  const raw = localStorage.getItem(LS_KEYS.grammar);
  return raw ? JSON.parse(raw) : DEFAULT_PAIRS;
}
function savePairs(pairs) {
  localStorage.setItem(LS_KEYS.grammar, JSON.stringify(pairs));
}
function loadOptions() {
  const raw = localStorage.getItem(LS_KEYS.options);
  return raw ? JSON.parse(raw) : { dailyCount: 10, revealFirst: false };
}
function saveOptions(o) {
  localStorage.setItem(LS_KEYS.options, JSON.stringify(o));
}

function pickNext(cards, stats) {
  const now = Date.now();
  const scored = cards.map((c) => {
    const st = stats[c.id] || { correct: 0, wrong: 0, lastSeen: 0 };
    const accuracyPenalty = 1 + st.wrong / (st.correct + 1);
    const hours = st.lastSeen ? (now - st.lastSeen) / 36e5 : 48;
    const recencyBoost = Math.min(2, Math.max(0.5, hours / 12));
    const weight = accuracyPenalty * recencyBoost;
    return { c, weight };
  });
  const total = scored.reduce((s, x) => s + x.weight, 0) || 1;
  let r = Math.random() * total;
  for (const x of scored) {
    if ((r -= x.weight) <= 0) return x.c;
  }
  return scored[scored.length - 1].c;
}

function fmtPct(n) {
  if (!isFinite(n)) return "–";
  return Math.round(n * 100) + "%";
}

function StatBadge({ label, value }) {
  return (
    <div className="text-xs bg-muted px-2 py-1 rounded-full whitespace-nowrap">
      <span className="opacity-70 mr-1">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function TroubleList({ cards, stats, onSelect }) {
  const enriched = useMemo(() => {
    return cards
      .map((c) => ({
        card: c,
        wrong: stats[c.id]?.wrong ?? 0,
        correct: stats[c.id]?.correct ?? 0,
      }))
      .sort((a, b) => b.wrong - a.wrong)
      .slice(0, 10);
  }, [cards, stats]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Most Missed</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {enriched.map(({ card, wrong, correct }) => (
          <button
            key={card.id}
            className="w-full text-left px-3 py-2 rounded-lg hover:bg-accent"
            onClick={() => onSelect?.(card)}
          >
            <div className="flex items-center justify-between">
              <div className="font-medium">{card.term}</div>
              <div className="text-sm opacity-70">
                {wrong} wrong · {correct} correct
              </div>
            </div>
            <div className="text-sm opacity-70">{card.translation}</div>
          </button>
        ))}
        {enriched.length === 0 && (
          <div className="text-sm opacity-70">No mistakes yet. Nice.</div>
        )}
      </CardContent>
    </Card>
  );
}

function DeckEditor({ cards, setCards }) {
  const [term, setTerm] = useState("");
  const [translation, setTranslation] = useState("");
  const [hint, setHint] = useState("");

  function addCard() {
    if (!term.trim() || !translation.trim()) return;
    const id = crypto.randomUUID();
    const next = [...cards, { id, term: term.trim(), translation: translation.trim(), hint: hint.trim() || undefined }];
    setCards(next);
    saveCards(next);
    setTerm("");
    setTranslation("");
    setHint("");
  }

  function remove(id) {
    const next = cards.filter((c) => c.id !== id);
    setCards(next);
    saveCards(next);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Deck</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <div>
            <Label>Term</Label>
            <Input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="bonjour" />
          </div>
          <div>
            <Label>Translation</Label>
            <Input value={translation} onChange={(e) => setTranslation(e.target.value)} placeholder="hello" />
          </div>
          <div>
            <Label>Hint (optional)</Label>
            <Input value={hint} onChange={(e) => setHint(e.target.value)} placeholder="greeting" />
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={addCard}><Plus className="w-4 h-4 mr-2"/>Add Card</Button>
          <ImportExport cards={cards} setCards={setCards} />
        </div>
        <div className="max-h-64 overflow-auto border rounded-lg divide-y">
          {cards.map((c) => (
            <div key={c.id} className="p-3 flex items-center justify-between">
              <div>
                <div className="font-medium">{c.term} → {c.translation}</div>
                {c.hint && <div className="text-sm opacity-70">{c.hint}</div>}
              </div>
              <Button variant="ghost" onClick={() => remove(c.id)}><Trash2 className="w-4 h-4"/></Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ImportExport({ cards, setCards }) {
  const fileRef = useRef(null);

  function exportJson() {
    const blob = new Blob([JSON.stringify({ cards }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "chillcards_deck.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function importJson(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (Array.isArray(parsed.cards)) {
          setCards(parsed.cards);
          saveCards(parsed.cards);
        }
      } catch (err) {
        alert("Invalid deck file");
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" onClick={exportJson}><Save className="w-4 h-4 mr-2"/>Export</Button>
      <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={importJson} />
      <Button variant="outline" onClick={() => fileRef.current?.click()}><Upload className="w-4 h-4 mr-2"/>Import</Button>
    </div>
  );
}

function GrammarEditor({ pairs, setPairs }) {
  const [pronoun, setPronoun] = useState("");
  const [verbForm, setVerbForm] = useState("");
  const [note, setNote] = useState("");

  function addPair() {
    if (!pronoun.trim() || !verbForm.trim()) return;
    const id = crypto.randomUUID();
    const next = [...pairs, { id, pronoun: pronoun.trim(), verbForm: verbForm.trim(), note: note.trim() || undefined }];
    setPairs(next);
    savePairs(next);
    setPronoun("");
    setVerbForm("");
    setNote("");
  }

  function remove(id) {
    const next = pairs.filter((p) => p.id !== id);
    setPairs(next);
    savePairs(next);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Grammar — Verb + Pronoun Pairs</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <div>
            <Label>Pronoun</Label>
            <Input value={pronoun} onChange={(e) => setPronoun(e.target.value)} placeholder="je" />
          </div>
          <div>
            <Label>Verb Form</Label>
            <Input value={verbForm} onChange={(e) => setVerbForm(e.target.value)} placeholder="mange" />
          </div>
          <div>
            <Label>Note (optional)</Label>
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="agreement rule" />
          </div>
        </div>
        <Button onClick={addPair}><Plus className="w-4 h-4 mr-2"/>Add Pair</Button>
        <div className="mt-2 border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-2">Pronoun</th>
                <th className="text-left p-2">Verb</th>
                <th className="text-left p-2">Note</th>
                <th className="text-right p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pairs.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="p-2 font-medium">{p.pronoun}</td>
                  <td className="p-2">{p.verbForm}</td>
                  <td className="p-2 opacity-70">{p.note}</td>
                  <td className="p-2 text-right">
                    <Button variant="ghost" onClick={() => remove(p.id)}><Trash2 className="w-4 h-4"/></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function PracticeCard({ card, revealFirst, onResult }) {
  const [revealed, setRevealed] = useState(revealFirst);

  useEffect(() => setRevealed(revealFirst), [card?.id, revealFirst]);

  if (!card) return null;
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Practice</CardTitle>
      </CardHeader>
      <CardContent className="h-full">
        <div className="h-64 md:h-80 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={revealed ? "back" : "front"}
              initial={{ rotateY: 90, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              exit={{ rotateY: -90, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="w-full h-full grid place-items-center rounded-2xl border text-center p-6"
            >
              {!revealed ? (
                <div>
                  <div className="text-2xl md:text-4xl font-bold">{card.term}</div>
                  {card.hint && <div className="mt-2 opacity-70">hint: {card.hint}</div>}
                </div>
              ) : (
                <div>
                  <div className="text-2xl md:text-4xl font-bold">{card.translation}</div>
                  <div className="mt-2 opacity-70">{card.term}</div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          <Button onClick={() => setRevealed((r) => !r)} variant="outline">
            {revealed ? "Hide" : "Reveal"}
          </Button>
          <Button onClick={() => onResult(card, true)}><RefreshCw className="w-4 h-4 mr-2"/>I knew it</Button>
          <Button variant="destructive" onClick={() => onResult(card, false)}><RotateCcw className="w-4 h-4 mr-2"/>I missed it</Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function App() {
  const [cards, setCards] = useState(/** @type {CardItem[]} */(loadCards()));
  const [pairs, setPairs] = useState(/** @type {GrammarPair[]} */(loadPairs()));
  const [stats, setStats] = useState(/** @type {Record<string, Stat>} */(loadStats()));
  const [options, setOptions] = useState(loadOptions());

  const [current, setCurrent] = useState(null);
  useEffect(() => {
    if (cards.length) setCurrent((c) => c ?? pickNext(cards, stats));
  }, [cards, stats]);

  function nextCard() {
    setCurrent(pickNext(cards, stats));
  }

  function onResult(card, correct) {
    const prev = stats[card.id] || { correct: 0, wrong: 0, lastSeen: 0 };
    const next = {
      ...stats,
      [card.id]: {
        correct: prev.correct + (correct ? 1 : 0),
        wrong: prev.wrong + (correct ? 0 : 1),
        lastSeen: Date.now(),
      },
    };
    setStats(next);
    saveStats(next);
    nextCard();
  }

  const totalCorrect = Object.values(stats).reduce((s, st) => s + st.correct, 0);
  const totalWrong = Object.values(stats).reduce((s, st) => s + st.wrong, 0);
  const accuracy = (totalCorrect + totalWrong) > 0 ? totalCorrect / (totalCorrect + totalWrong) : NaN;

  function setDailyCount(n) {
    const next = { ...options, dailyCount: n };
    setOptions(next); saveOptions(next);
  }
  function setRevealFirst(v) {
    const next = { ...options, revealFirst: v };
    setOptions(next); saveOptions(next);
  }

  function resetStats() {
    if (!confirm("Reset all progress?")) return;
    setStats({});
    saveStats({});
  }

  function focusCard(c) {
    setCurrent(c);
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <div className="mx-auto max-w-5xl grid gap-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold">ChillCards</h1>
          <div className="flex items-center gap-2">
            <StatBadge label="Accuracy" value={fmtPct(accuracy)} />
            <StatBadge label="Known" value={totalCorrect} />
            <StatBadge label="Missed" value={totalWrong} />
          </div>
        </header>

        <Tabs defaultValue="practice" className="w-full">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="practice">Practice</TabsTrigger>
            <TabsTrigger value="trouble">Trouble</TabsTrigger>
            <TabsTrigger value="deck">Deck</TabsTrigger>
            <TabsTrigger value="grammar">Grammar</TabsTrigger>
          </TabsList>

          <TabsContent value="practice" className="grid md:grid-cols-3 gap-4 mt-4">
            <div className="md:col-span-2">
              <PracticeCard card={current} revealFirst={options.revealFirst} onResult={onResult} />
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Session Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="reveal">Reveal answers first</Label>
                  <Switch id="reveal" checked={options.revealFirst} onCheckedChange={setRevealFirst} />
                </div>
                <div>
                  <Label>Daily target (just a vibe, not enforced)</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input type="number" min={1} max={100} value={options.dailyCount} onChange={(e) => setDailyCount(parseInt(e.target.value || "10"))} className="w-24" />
                    <Progress value={Math.min(100, (totalCorrect % options.dailyCount) / options.dailyCount * 100)} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={nextCard}><RefreshCw className="w-4 h-4 mr-2"/>Next Card</Button>
                  <Button variant="destructive" onClick={resetStats}><Trash2 className="w-4 h-4 mr-2"/>Reset Progress</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trouble" className="mt-4 grid md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <TroubleList cards={cards} stats={stats} onSelect={focusCard} />
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Why these show up more</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm opacity-80">
                <p>
                  The next-card picker weights items by your personal miss rate and how long it's been since you saw them.
                </p>
                <p>
                  Missed cards pop up a bit more often; things you know fade out until it's time for a gentle refresh.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="deck" className="mt-4">
            <DeckEditor cards={cards} setCards={setCards} />
          </TabsContent>

          <TabsContent value="grammar" className="mt-4 grid md:grid-cols-2 gap-4">
            <GrammarEditor pairs={pairs} setPairs={setPairs} />
            <Card>
              <CardHeader>
                <CardTitle>How to use this</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm opacity-80">
                <p>
                  Add verb + pronoun pairs for the tense you're practicing (e.g., present, preterite). You can create one sheet per verb or mix and match.
                </p>
                <p>
                  Tip: put mnemonic notes in the <em>Note</em> column, like "-ger verbs keep the e before -ons".
                </p>
                <p>
                  This tab is just a quick-reference; it doesn't gatekeep your studying or force a sequence. You do you.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <footer className="text-xs opacity-70 text-center pt-2">
          Local-first. No timers. No nags. Happy studying ✨
        </footer>
      </div>
    </div>
  );
}
