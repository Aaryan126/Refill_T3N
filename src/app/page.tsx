"use client";

import {
  AlertTriangle,
  Archive,
  Bot,
  Check,
  ClipboardList,
  FileCheck2,
  History,
  LockKeyhole,
  MessageSquare,
  RefreshCcw,
  Search,
  Send,
  ShieldCheck,
  ShoppingCart,
  SlidersHorizontal,
  SquareTerminal,
  User,
  X
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type {
  AgentRunResult,
  AgentTraceEntry,
  AuditLogEntry,
  DemoScenario,
  InventoryItem,
  MerchantProduct,
  RefillMandate
} from "@/lib/types";

type DemoState = {
  mandates: RefillMandate[];
  inventory: InventoryItem[];
  products: MerchantProduct[];
  audit: AuditLogEntry[];
};

type View = "chat" | "mandates" | "audit";
type RunState = DemoScenario | "llm";
type ChatOnlyReply = {
  userMessage: string;
  assistantMessage: string;
};

const scenarios: Array<{ id: DemoScenario; label: string; prompt: string; tone: "run" | "block" | "neutral" }> = [
  { id: "success", label: "Approve refill", prompt: "My lens solution is low. Refill it if the mandate allows it.", tone: "run" },
  { id: "no_refill_needed", label: "Check stock", prompt: "Check if my lens solution needs a refill yet.", tone: "neutral" },
  { id: "over_budget", label: "Over budget", prompt: "Try the refill, but use the more expensive option.", tone: "block" },
  { id: "unapproved_merchant", label: "Wrong merchant", prompt: "Try buying it from a merchant I did not approve.", tone: "block" },
  { id: "wrong_category", label: "Wrong item", prompt: "Try replacing lens solution with another category.", tone: "block" },
  { id: "over_quantity", label: "Too many", prompt: "Try ordering more bottles than my mandate allows.", tone: "block" },
  { id: "regulated_item", label: "Needs review", prompt: "Try an allergy medication refill.", tone: "block" },
  { id: "pet_food_success", label: "Pet food", prompt: "Refill pet food under the approved mandate.", tone: "run" }
];

const money = new Intl.NumberFormat("en-SG", {
  style: "currency",
  currency: "SGD",
  minimumFractionDigits: 2
});

export default function Home() {
  const [state, setState] = useState<DemoState | null>(null);
  const [result, setResult] = useState<AgentRunResult | null>(null);
  const [running, setRunning] = useState<RunState | null>(null);
  const [stockValue, setStockValue] = useState(15);
  const [activeView, setActiveView] = useState<View>("chat");
  const [selectedScenario, setSelectedScenario] = useState<DemoScenario>("success");
  const [chatInput, setChatInput] = useState(scenarios[0].prompt);
  const [chatError, setChatError] = useState<string | null>(null);
  const [chatOnlyReply, setChatOnlyReply] = useState<ChatOnlyReply | null>(null);

  const visibleMandates = useMemo(() => state?.mandates ?? [], [state?.mandates]);
  const auditRows = state?.audit.slice(0, 12) ?? [];
  useEffect(() => {
    void refreshState();
  }, []);

  async function refreshState() {
    const response = await fetch("/api/demo/state", { cache: "no-store" });
    const nextState = (await response.json()) as DemoState;
    const nextLensInventory = nextState.inventory.find((item) => item.id === "inventory_lens_001");
    if (nextLensInventory?.currentPercent !== undefined) {
      setStockValue(nextLensInventory.currentPercent);
    }
    setState(nextState);
  }

  async function updateStock(value: number) {
    setStockValue(value);
    await fetch("/api/inventory/inventory_lens_001/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPercent: value })
    });
    await refreshState();
  }

  async function runChat() {
    const message = chatInput.trim();
    if (!message) return;

    setChatError(null);
    setRunning("llm");
    setActiveView("chat");
    const response = await fetch("/api/agent/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message })
    });
    const body = await response.json();
    if (!response.ok) {
      setChatError(body.error ?? "Agent chat failed.");
      setChatOnlyReply(null);
    } else if (body.type === "message") {
      setResult(null);
      setChatOnlyReply({
        userMessage: body.userMessage,
        assistantMessage: body.assistantMessage
      });
    } else {
      setResult(body);
      setChatOnlyReply(null);
      setSelectedScenario(body.scenario ?? selectedScenario);
      await refreshState();
    }
    setRunning(null);
  }

  function selectScenarioShortcut(scenario: DemoScenario) {
    setSelectedScenario(scenario);
    setChatInput(scenarios.find((item) => item.id === scenario)?.prompt ?? scenarios[0].prompt);
  }

  async function resetDemo() {
    setResult(null);
    setChatOnlyReply(null);
    await fetch("/api/demo/reset", { method: "POST" });
    await refreshState();
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-950">
      <div className="mx-auto grid min-h-screen w-full max-w-[1680px] grid-cols-1 lg:h-screen lg:grid-cols-[280px_1fr_380px] lg:overflow-hidden">
        <section className="order-1 flex h-[100dvh] min-h-0 flex-col border-x border-slate-200 bg-white lg:order-2 lg:h-screen">
          <TopBar result={result} running={running} />
          {activeView === "chat" ? (
            <ChatWorkspace
              result={result}
              chatOnlyReply={chatOnlyReply}
              running={running}
              chatError={chatError}
              chatInput={chatInput}
              selectedScenario={selectedScenario}
              setChatInput={setChatInput}
              setSelectedScenario={selectScenarioShortcut}
              runChat={() => void runChat()}
            />
          ) : activeView === "mandates" ? (
            <MandatesPage inventory={state?.inventory ?? []} mandates={visibleMandates} />
          ) : (
            <AuditPage auditRows={auditRows} />
          )}
        </section>

        <Sidebar
          activeView={activeView}
          loaded={state !== null}
          mandates={visibleMandates}
          onReset={() => void resetDemo()}
          onViewChange={setActiveView}
          stockValue={stockValue}
          updateStock={(value) => void updateStock(value)}
        />

        <Inspector result={result} auditRows={auditRows} />
      </div>
    </main>
  );
}

function Sidebar({
  activeView,
  loaded,
  mandates,
  onReset,
  onViewChange,
  stockValue,
  updateStock
}: {
  activeView: View;
  loaded: boolean;
  mandates: RefillMandate[];
  onReset: () => void;
  onViewChange: (view: View) => void;
  stockValue: number;
  updateStock: (value: number) => void;
}) {
  const nav = [
    { id: "chat" as const, label: "Agent chat", icon: MessageSquare },
    { id: "mandates" as const, label: "Mandates", icon: ClipboardList },
    { id: "audit" as const, label: "Audit", icon: History }
  ];

  return (
    <aside className="order-2 flex flex-col gap-5 border-b border-slate-200 bg-slate-50 p-4 lg:order-1 lg:h-screen lg:overflow-auto lg:border-b-0">
      <div className="flex items-center gap-3 px-1">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600 text-white">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-lg font-semibold">RefillGuard</h1>
          <p className="text-xs font-medium text-slate-500">T3N refill agent</p>
        </div>
      </div>

      <nav className="grid gap-1">
        {nav.map((item) => {
          const Icon = item.icon;
          const active = activeView === item.id;
          return (
            <button
              className={`flex h-10 items-center gap-3 rounded-md px-3 text-sm font-semibold transition ${
                active ? "bg-white text-slate-950 shadow-sm ring-1 ring-slate-200" : "text-slate-600 hover:bg-white hover:text-slate-950"
              }`}
              key={item.id}
              onClick={() => onViewChange(item.id)}
              type="button"
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
      </nav>

      <section className="rounded-lg border border-slate-200 bg-white p-3">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <SlidersHorizontal className="h-4 w-4 text-emerald-700" />
            Stock level
          </div>
          <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">{stockValue}%</span>
        </div>
        <input
          aria-label="Bottle level"
          className="w-full accent-emerald-700"
          max={100}
          min={0}
          onChange={(event) => updateStock(Number(event.target.value))}
          type="range"
          value={stockValue}
        />
        <div className="mt-3 grid grid-cols-3 gap-2">
          {[50, 15, 5].map((value) => (
            <button
              className="h-8 rounded-md border border-slate-200 text-xs font-semibold text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
              key={value}
              onClick={() => updateStock(value)}
              type="button"
            >
              {value}%
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-3">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <Archive className="h-4 w-4 text-emerald-700" />
          Active scopes
        </div>
        <div className="grid gap-2">
          <StatusRow label="Mandates" value={loaded ? String(mandates.length) : "3"} />
          <StatusRow label="Secrets exposed" value="0" />
          <StatusRow label="Agent mode" value="Self-call" />
        </div>
      </section>

      <button
        className="mt-auto flex h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
        onClick={onReset}
        type="button"
      >
        <RefreshCcw className="h-4 w-4" />
        Reset demo
      </button>
    </aside>
  );
}

function TopBar({ result, running }: { result: AgentRunResult | null; running: RunState | null }) {
  const auth = result?.authorizationResult;
  const status = running ? "Running" : auth?.status ? statusLabel(auth.status) : "Ready";

  return (
    <header className="flex min-h-16 items-center justify-between gap-4 border-b border-slate-200 px-4 sm:px-6">
      <div>
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
          <Bot className="h-4 w-4 text-emerald-700" />
          Refill assistant
        </div>
        <p className="mt-0.5 text-xs text-slate-500">The agent asks T3N before any checkout action.</p>
      </div>
      <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
        {running ? <RefreshCcw className="h-4 w-4 animate-spin text-emerald-700" /> : <ShieldCheck className="h-4 w-4 text-emerald-700" />}
        {status}
      </div>
    </header>
  );
}

function ChatWorkspace({
  chatError,
  chatInput,
  chatOnlyReply,
  result,
  running,
  runChat,
  selectedScenario,
  setChatInput,
  setSelectedScenario
}: {
  chatError: string | null;
  chatInput: string;
  chatOnlyReply: ChatOnlyReply | null;
  result: AgentRunResult | null;
  running: RunState | null;
  runChat: () => void;
  selectedScenario: DemoScenario;
  setChatInput: (value: string) => void;
  setSelectedScenario: (scenario: DemoScenario) => void;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-6 sm:px-6">
        <ChatBubble role="agent">
          <p className="font-semibold text-slate-950">I can handle approved refills, but I need a mandate match before checkout.</p>
          <p className="mt-1 text-slate-600">Tell me what you want done. I will map it to an agent action, create a purchase intent when needed, ask T3N, then show the result.</p>
        </ChatBubble>

        {chatOnlyReply ? (
          <>
            <ChatBubble role="user">
              <p>{chatOnlyReply.userMessage}</p>
            </ChatBubble>
            <ChatBubble role="agent">
              <p>{chatOnlyReply.assistantMessage}</p>
            </ChatBubble>
          </>
        ) : null}

        {result ? (
          <>
            <ChatBubble role="user">
              <p>{result.userMessage ?? scenarios.find((scenario) => scenario.id === result.scenario)?.prompt}</p>
            </ChatBubble>
            <AgentResultMessage result={result} />
          </>
        ) : null}

        {chatError ? (
          <ChatBubble role="agent">
            <p className="font-semibold text-rose-700">Could not run the LLM orchestrator</p>
            <p className="mt-1 text-slate-600">{chatError}</p>
          </ChatBubble>
        ) : null}
      </div>

      <div className="shrink-0 border-t border-slate-200 bg-white p-4 sm:p-5">
        <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
          {scenarios.map((scenario) => (
            <button
              className={`h-9 shrink-0 rounded-full border px-3 text-sm font-semibold transition ${scenarioChipClass(
                scenario.tone,
                selectedScenario === scenario.id
              )}`}
              key={scenario.id}
              onClick={() => setSelectedScenario(scenario.id)}
              type="button"
            >
              {scenario.label}
            </button>
          ))}
        </div>
        <div className="flex items-end gap-3 rounded-xl border border-slate-200 bg-slate-50 p-2">
          <textarea
            aria-label="Agent request"
            className="min-h-11 flex-1 resize-none bg-transparent px-3 py-2 text-sm leading-6 text-slate-700 outline-none placeholder:text-slate-400"
            disabled={running !== null}
            onChange={(event) => setChatInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                runChat();
              }
            }}
            placeholder="Ask the refill agent what to do..."
            rows={2}
            value={chatInput}
          />
          <button
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white transition hover:bg-emerald-700 disabled:cursor-wait disabled:bg-slate-300"
            disabled={running !== null || chatInput.trim().length === 0}
            onClick={runChat}
            type="button"
            aria-label="Send agent request"
          >
            {running ? <RefreshCcw className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </button>
        </div>
      </div>
    </div>
  );
}

function AgentResultMessage({ result }: { result: AgentRunResult }) {
  const auth = result.authorizationResult;
  const approved = auth.status === "approved";
  const manual = auth.status === "manual_review";
  const blocked = auth.status === "blocked";

  return (
    <ChatBubble role="agent">
      <div className="flex items-start gap-3">
        <span className={`mt-0.5 rounded-full p-1 ${approved ? "bg-emerald-100 text-emerald-700" : manual ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"}`}>
          {approved ? <Check className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-950">{approved ? "Approved and ready for checkout" : manual ? "Paused for manual review" : blocked ? "Blocked by mandate" : "No refill needed"}</p>
          <p className="mt-1 text-slate-600">{approved ? `T3N approved ${result.purchaseIntent?.productName ?? "the refill"}.` : auth.blockedReason ?? result.refillReason}</p>
        </div>
      </div>

      {result.orchestration ? (
        <div className="mt-4 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs leading-5 text-emerald-900">
          <p className="font-semibold">{result.orchestration.userFacingReply}</p>
          <p className="mt-1 text-emerald-800">
            LLM routed this as {scenarios.find((scenario) => scenario.id === result.orchestration?.scenario)?.label ?? result.orchestration.scenario} with{" "}
            {Math.round(result.orchestration.confidence * 100)}% confidence.
          </p>
        </div>
      ) : null}

      {result.purchaseIntent ? (
        <div className="mt-4 grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:grid-cols-3">
          <MiniFact icon={<ShoppingCart className="h-4 w-4" />} label="Item" value={result.purchaseIntent.productName} />
          <MiniFact icon={<Search className="h-4 w-4" />} label="Merchant" value={result.purchaseIntent.merchantName} />
          <MiniFact icon={<ShieldCheck className="h-4 w-4" />} label="Price" value={money.format(result.purchaseIntent.priceSgd)} />
        </div>
      ) : null}

      <div className="mt-4 lg:hidden">
        <AgentTerminal result={result} compact />
      </div>
    </ChatBubble>
  );
}

function Inspector({ result, auditRows }: { result: AgentRunResult | null; auditRows: AuditLogEntry[] }) {
  const auth = result?.authorizationResult;
  const passed = auth?.checks.filter((check) => check.passed).length ?? 0;
  const total = auth?.checks.length ?? 0;

  return (
    <aside className="hidden flex-col gap-4 overflow-auto bg-slate-50 p-4 lg:order-3 lg:flex lg:h-screen">
      <AgentTerminal result={result} />

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
            <FileCheck2 className="h-4 w-4 text-emerald-700" />
            T3N inspector
          </div>
          <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">{total ? `${passed}/${total}` : "idle"}</span>
        </div>
        {!auth ? (
          <EmptyBlock text="Run a request to inspect authorization checks." />
        ) : (
          <div className="space-y-3">
            <StatusBanner auth={auth} />
            <div className="max-h-[340px] overflow-auto rounded-md border border-slate-200">
              {auth.checks.map((check) => (
                <div className="flex items-start gap-3 border-b border-slate-100 px-3 py-2.5 last:border-b-0" key={check.key}>
                  <span className={`mt-0.5 rounded-full p-0.5 ${check.passed ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                    {check.passed ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{check.label}</p>
                    {!check.passed ? <p className="mt-0.5 text-xs text-slate-500">Expected {String(check.expected)} / got {String(check.actual)}</p> : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-950">
          <LockKeyhole className="h-4 w-4 text-emerald-700" />
          Sealed fields
        </div>
        <div className="grid gap-2">
          {(auth?.sealedFieldsUsed.length ? auth.sealedFieldsUsed : ["t3n://payment/default_card", "t3n://address/home", "t3n://phone/primary"]).map((field) => (
            <div className="rounded-md bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600" key={field}>
              {field}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-950">
          <History className="h-4 w-4 text-emerald-700" />
          Latest audit
        </div>
        <div className="space-y-2">
          {auditRows.slice(0, 5).map((entry) => (
            <AuditLine entry={entry} key={entry.id} />
          ))}
        </div>
      </section>
    </aside>
  );
}

function AgentTerminal({ compact = false, result }: { compact?: boolean; result: AgentRunResult | null }) {
  const trace = result?.trace ?? [];
  const visibleTrace = compact ? trace.slice(-5) : trace;

  return (
    <section className={`${compact ? "" : "rounded-lg border border-slate-200 bg-white p-4"}`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
          <SquareTerminal className="h-4 w-4 text-emerald-700" />
          Agent terminal
        </div>
        <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">{trace.length ? `${trace.length} steps` : "idle"}</span>
      </div>

      <div className={`overflow-auto rounded-lg bg-slate-950 p-3 font-mono text-[11px] leading-5 text-slate-200 shadow-inner ${compact ? "max-h-56" : "max-h-[420px]"}`}>
        {!trace.length ? (
          <div className="text-slate-400">
            <span className="text-emerald-300">$</span> waiting for an agent task
          </div>
        ) : (
          <div className="space-y-2">
            {visibleTrace.map((entry) => (
              <TerminalLine entry={entry} key={entry.id} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function TerminalLine({ entry }: { entry: AgentTraceEntry }) {
  const metadata = entry.metadata
    ? Object.entries(entry.metadata)
        .map(([key, value]) => `${key}=${String(value)}`)
        .join(" ")
    : "";

  return (
    <div className="min-w-0">
      <div className="flex min-w-0 items-start gap-2">
        <span className="shrink-0 text-slate-500">{new Date(entry.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
        <span className={`shrink-0 ${traceActorClass(entry.actor)}`}>{entry.actor}</span>
        <span className={`shrink-0 ${traceStatusClass(entry.status)}`}>{entry.status}</span>
      </div>
      <div className="min-w-0 pl-0 sm:pl-[4.9rem]">
        <span className="text-sky-300">{entry.command}</span>
        <span className="text-slate-500"> :: </span>
        <span className="break-words text-slate-100">{entry.detail}</span>
      </div>
      {metadata ? <div className="break-words pl-0 text-slate-500 sm:pl-[4.9rem]">{metadata}</div> : null}
    </div>
  );
}

function MandatesPage({ inventory, mandates }: { inventory: InventoryItem[]; mandates: RefillMandate[] }) {
  return (
    <div className="flex-1 overflow-auto p-4 sm:p-6">
      <div className="mb-5 flex items-center gap-2">
        <ClipboardList className="h-5 w-5 text-emerald-700" />
        <h2 className="text-xl font-semibold">Mandates</h2>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        {mandates.map((mandate) => (
          <MandateCard inventory={inventory.find((item) => item.mandateId === mandate.id)} key={mandate.id} mandate={mandate} />
        ))}
      </div>
    </div>
  );
}

function AuditPage({ auditRows }: { auditRows: AuditLogEntry[] }) {
  return (
    <div className="flex-1 overflow-auto p-4 sm:p-6">
      <div className="mb-5 flex items-center gap-2">
        <History className="h-5 w-5 text-emerald-700" />
        <h2 className="text-xl font-semibold">Audit</h2>
      </div>
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        {auditRows.map((entry) => (
          <div className="grid gap-2 border-b border-slate-100 px-4 py-3 text-sm last:border-b-0 sm:grid-cols-[92px_110px_1fr]" key={entry.id}>
            <span className="font-medium text-slate-500">{new Date(entry.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
            <span className="font-semibold capitalize text-slate-700">{entry.actorType}</span>
            <span className="text-slate-800">{entry.title}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MandateCard({ inventory, mandate }: { inventory?: InventoryItem; mandate: RefillMandate }) {
  const trigger =
    mandate.trigger.type === "stock_percentage"
      ? `Refill below ${mandate.trigger.thresholdPercent}%`
      : mandate.trigger.type === "days_remaining"
        ? `Refill under ${mandate.trigger.thresholdDays} days`
        : `Refill under ${mandate.trigger.thresholdUnits} units`;
  const current =
    inventory?.currentPercent !== undefined
      ? `${inventory.currentPercent}%`
      : inventory?.estimatedDaysRemaining !== undefined
        ? `${inventory.estimatedDaysRemaining} days`
        : `${inventory?.currentUnits ?? 0} units`;

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-slate-950">{inventory?.name ?? readableCategory(mandate.category)}</h3>
          <p className="mt-1 text-sm text-slate-500">{trigger}</p>
        </div>
        <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-sm font-semibold text-emerald-700">{current}</span>
      </div>
      <div className="grid gap-2 text-sm">
        <StatusRow label="Budget" value={money.format(mandate.maxPriceSgd)} />
        <StatusRow label="Quantity" value={String(mandate.maxQuantity)} />
        <StatusRow label="Delivery" value={`${mandate.delivery.maxDays} days`} />
        <StatusRow label="Merchants" value={mandate.approvedMerchants.join(", ")} />
      </div>
    </article>
  );
}

function ChatBubble({ children, role }: { children: React.ReactNode; role: "agent" | "user" }) {
  const isUser = role === "user";
  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser ? (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white">
          <Bot className="h-5 w-5" />
        </div>
      ) : null}
      <div className={`max-w-[780px] rounded-xl px-4 py-3 text-sm leading-6 shadow-sm ${isUser ? "bg-slate-950 text-white" : "border border-slate-200 bg-white text-slate-700"}`}>
        {children}
      </div>
      {isUser ? (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-slate-700">
          <User className="h-5 w-5" />
        </div>
      ) : null}
    </div>
  );
}

function StatusBanner({ auth }: { auth: AgentRunResult["authorizationResult"] }) {
  const approved = auth.status === "approved";
  const manual = auth.status === "manual_review";
  return (
    <div className={`rounded-lg border px-3 py-3 ${approved ? "border-emerald-200 bg-emerald-50" : manual ? "border-amber-200 bg-amber-50" : "border-rose-200 bg-rose-50"}`}>
      <p className="text-sm font-semibold text-slate-950">{statusLabel(auth.status)}</p>
      <p className="mt-1 text-xs text-slate-600">{auth.t3nExecutionId ?? auth.blockedReason ?? "No execution id yet"}</p>
    </div>
  );
}

function MiniFact({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="min-w-0">
      <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
        {icon}
        {label}
      </div>
      <p className="truncate text-sm font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="truncate text-right font-semibold text-slate-800">{value}</span>
    </div>
  );
}

function AuditLine({ entry }: { entry: AuditLogEntry }) {
  return (
    <div className="rounded-md bg-slate-50 px-3 py-2">
      <p className="truncate text-sm font-semibold text-slate-800">{entry.title}</p>
      <p className="mt-0.5 text-xs capitalize text-slate-500">{entry.actorType}</p>
    </div>
  );
}

function EmptyBlock({ text }: { text: string }) {
  return <div className="flex min-h-32 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 text-center text-sm text-slate-500">{text}</div>;
}

function scenarioChipClass(tone: "run" | "block" | "neutral", active: boolean) {
  if (active) return "border-slate-950 bg-slate-950 text-white";
  if (tone === "run") return "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100";
  if (tone === "block") return "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100";
  return "border-slate-200 bg-white text-slate-600 hover:bg-slate-100";
}

function traceActorClass(actor: AgentTraceEntry["actor"]) {
  if (actor === "llm") return "text-violet-300";
  if (actor === "policy") return "text-amber-300";
  if (actor === "t3n") return "text-emerald-300";
  if (actor === "merchant") return "text-cyan-300";
  if (actor === "system") return "text-slate-300";
  return "text-sky-300";
}

function traceStatusClass(status: AgentTraceEntry["status"]) {
  if (status === "ok") return "text-emerald-300";
  if (status === "blocked") return "text-rose-300";
  if (status === "review") return "text-amber-300";
  if (status === "skipped") return "text-slate-500";
  if (status === "running") return "text-sky-300";
  return "text-slate-400";
}

function statusLabel(status: AgentRunResult["authorizationResult"]["status"]) {
  if (status === "approved") return "Approved";
  if (status === "manual_review") return "Manual review";
  if (status === "not_needed") return "No refill needed";
  return "Blocked";
}

function readableCategory(category: string) {
  return category
    .split("_")
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(" ");
}
