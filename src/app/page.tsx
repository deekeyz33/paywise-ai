"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Activity,
  ArrowDownUp,
  ArrowRight,
  BarChart3,
  Bot,
  CheckCircle2,
  Clock3,
  CreditCard,
  LayoutDashboard,
  Menu,
  Moon,
  Send,
  Settings,
  ShieldCheck,
  Sun,
  X,
  Zap,
} from "lucide-react";

import {
  comparePayments,
  type PaymentRoute,
  type PaymentResult,
} from "@/lib/calculations";

import ComparisonHistory from "@/components/ComparisonHistory";

type PageName =
  | "Dashboard"
  | "Compare Routes"
  | "AI Assistant"
  | "Transactions"
  | "Settings";

interface ChatMessage {
  id: number;
  role: "assistant" | "user";
  text: string;
}

export default function Home() {
  const [activePage, setActivePage] = useState<PageName>("Dashboard");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [themeLoaded, setThemeLoaded] = useState(false);

  const [sendAmount, setSendAmount] = useState(500);

  const [fiat, setFiat] = useState<PaymentRoute>({
    name: "Traditional Fiat",
    sendAmount: 500,
    exchangeRate: 1500,
    providerFee: 5,
    networkFee: 0,
    payoutFee: 0,
  });

  const [usdt, setUsdt] = useState<PaymentRoute>({
    name: "USDT",
    sendAmount: 500,
    exchangeRate: 1490,
    providerFee: 0,
    networkFee: 1,
    payoutFee: 500,
  });

  const [chatInput, setChatInput] = useState("");

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      role: "assistant",
      text: "Hello! I'm Paywise Assistant. I can explain your payment comparison, fees, exchange rates and USDT considerations. What would you like to know?",
    },
  ]);

  // Load saved theme
  useEffect(() => {
    const savedTheme = localStorage.getItem("paywise-theme");

    if (savedTheme === "dark" || savedTheme === "light") {
      setTheme(savedTheme);
    }

    setThemeLoaded(true);
  }, []);

  // Save theme
  useEffect(() => {
    if (!themeLoaded) return;

    localStorage.setItem("paywise-theme", theme);
  }, [theme, themeLoaded]);

  function toggleTheme() {
    setTheme((current) => (current === "light" ? "dark" : "light"));
  }

  // Payment calculations
  const comparison = useMemo(() => {
    try {
      const data = comparePayments(
        { ...fiat, sendAmount },
        { ...usdt, sendAmount }
      );

      return {
        data: {
          fiat: data.fiat,
          usdt: data.stablecoin,
          difference: data.difference,
          cheaperRoute: data.cheaperRoute,
        },
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error:
          error instanceof Error
            ? error.message
            : "Unable to calculate comparison.",
      };
    }
  }, [fiat, usdt, sendAmount]);

  const result = comparison.data;

  const historyComparison = result
    ? {
        fiat: result.fiat,
        stablecoin: result.usdt,
        difference: result.difference,
        cheaperRoute: result.cheaperRoute,
      }
    : null;

  const formatNGN = (amount: number) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 2,
    }).format(amount);

  const formatUSD = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(amount);

  function updateFiat(field: keyof PaymentRoute, value: number) {
    setFiat((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function updateUsdt(field: keyof PaymentRoute, value: number) {
    setUsdt((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  // Local rule-based assistant
  function getAssistantResponse(question: string): string {
    const q = question.toLowerCase();

    if (!result) {
      return "I cannot analyse the routes until the payment inputs are valid. Please check your amount, exchange rates and fees.";
    }

    if (
      q.includes("risk") ||
      q.includes("safe") ||
      q.includes("secure") ||
      q.includes("danger")
    ) {
      return "USDT has risks including price depegging, blockchain network mistakes, wallet security, liquidity limitations and regulatory restrictions. Always verify the receiving network and provider before sending funds. Paywise does not execute or guarantee payments.";
    }

    if (
      q.includes("fee") ||
      q.includes("charge") ||
      q.includes("cost")
    ) {
      return `Fiat fees: provider ${formatUSD(
        result.fiat.providerFee
      )}, network ${formatUSD(
        result.fiat.networkFee
      )}, payout ${formatNGN(
        result.fiat.payoutFee
      )}. USDT fees: provider ${formatUSD(
        result.usdt.providerFee
      )}, network ${formatUSD(
        result.usdt.networkFee
      )}, payout ${formatNGN(result.usdt.payoutFee)}.`;
    }

    if (
      q.includes("rate") ||
      q.includes("exchange") ||
      q.includes("change")
    ) {
      return `A 1% exchange-rate movement would change the converted amount by approximately ${formatNGN(
        result.fiat.convertedAmount * 0.01
      )} on the fiat route and ${formatNGN(
        result.usdt.convertedAmount * 0.01
      )} on the USDT route, assuming fees remain unchanged. This is a sensitivity estimate, not a market forecast.`;
    }

    if (
      q.includes("compare") ||
      q.includes("better") ||
      q.includes("difference") ||
      q.includes("winner") ||
      q.includes("cheaper")
    ) {
      return `${result.cheaperRoute} currently gives the higher recipient payout. Fiat pays ${formatNGN(
        result.fiat.recipientReceives
      )}, while USDT pays ${formatNGN(
        result.usdt.recipientReceives
      )}. The difference is ${formatNGN(
        result.difference
      )}. This depends on the rates and fees entered.`;
    }

    if (
      q.includes("hello") ||
      q.includes("hi") ||
      q.includes("hey")
    ) {
      return "Hello! Ask me about your payment routes, fees, exchange rates or USDT risks.";
    }

    return "I can explain payment route differences, transaction fees, exchange-rate sensitivity and USDT risks. Try asking one of those questions.";
  }

  function sendMessage(question: string) {
    const cleanQuestion = question.trim();

    if (!cleanQuestion) return;

    const answer = getAssistantResponse(cleanQuestion);

    setMessages((previous) => [
      ...previous,
      {
        id: Date.now(),
        role: "user",
        text: cleanQuestion,
      },
      {
        id: Date.now() + 1,
        role: "assistant",
        text: answer,
      },
    ]);

    setChatInput("");
  }

  function askAssistant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    sendMessage(chatInput);
  }

  const navigation = [
    { name: "Dashboard" as PageName, icon: LayoutDashboard },
    { name: "Compare Routes" as PageName, icon: ArrowDownUp },
    { name: "AI Assistant" as PageName, icon: Bot },
    { name: "Transactions" as PageName, icon: Clock3 },
    { name: "Settings" as PageName, icon: Settings },
  ];

  function navigate(page: PageName) {
    setActivePage(page);
    setMobileMenu(false);
  }

  function StatCard({
    title,
    value,
    description,
    icon: Icon,
  }: {
    title: string;
    value: string;
    description: string;
    icon: typeof Activity;
  }) {
    return (
      <div className="pw-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <p className="pw-muted text-sm">{title}</p>
          <Icon size={20} className="text-blue-500" />
        </div>

        <h3 className="break-words text-xl font-bold sm:text-2xl">
          {value}
        </h3>

        <p className="pw-muted mt-2 text-xs">{description}</p>
      </div>
    );
  }

  function RouteCard({
    title,
    route,
    isUsdt = false,
  }: {
    title: string;
    route: PaymentResult;
    isUsdt?: boolean;
  }) {
    return (
      <div className="pw-card p-5">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-semibold">{title}</h3>

          <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-500">
            {isUsdt ? "Stablecoin" : "Traditional"}
          </span>
        </div>

        <p className="pw-muted text-sm">Recipient receives</p>

        <h2 className="mt-1 break-words text-2xl font-bold sm:text-3xl">
          {formatNGN(route.recipientReceives)}
        </h2>

        <div className="pw-divider mt-5 space-y-3 border-t pt-4 text-sm">
          <div className="flex justify-between gap-3">
            <span className="pw-muted">Exchange rate</span>
            <strong>₦{route.exchangeRate.toLocaleString()}</strong>
          </div>

          <div className="flex justify-between gap-3">
            <span className="pw-muted">Provider fee</span>
            <strong>{formatUSD(route.providerFee)}</strong>
          </div>

          <div className="flex justify-between gap-3">
            <span className="pw-muted">Network fee</span>
            <strong>{formatUSD(route.networkFee)}</strong>
          </div>

          <div className="flex justify-between gap-3">
            <span className="pw-muted">Payout fee</span>
            <strong>{formatNGN(route.payoutFee)}</strong>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      data-theme={theme}
      className="paywise-app min-h-screen w-full overflow-x-hidden"
    >
      {/* Mobile navigation backdrop */}
      {mobileMenu && (
        <button
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setMobileMenu(false)}
          aria-label="Close navigation"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`pw-sidebar fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r transition-transform duration-300 lg:translate-x-0 ${
          mobileMenu ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-20 items-center justify-between border-b px-6">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              PAYWISE<span className="text-blue-500"> AI</span>
            </h1>
            <p className="pw-muted text-xs">Payment Intelligence</p>
          </div>

          <button
            className="lg:hidden"
            onClick={() => setMobileMenu(false)}
            aria-label="Close menu"
          >
            <X size={21} />
          </button>
        </div>

        <nav className="flex-1 space-y-2 p-4">
          <p className="pw-muted mb-4 px-3 text-xs font-semibold uppercase tracking-wider">
            Workspace
          </p>

          {navigation.map((item) => {
            const Icon = item.icon;
            const active = activePage === item.name;

            return (
              <button
                key={item.name}
                onClick={() => navigate(item.name)}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
                  active
                    ? "bg-blue-600 text-white"
                    : "pw-nav-button"
                }`}
              >
                <Icon size={18} />
                {item.name}
              </button>
            );
          })}
        </nav>

        <div className="pw-sidebar-note m-4 rounded-xl p-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <ShieldCheck size={17} />
            Decision support
          </div>

          <p className="pw-muted mt-2 text-xs leading-5">
            Compare payment routes using transparent calculations.
          </p>
        </div>
      </aside>

      {/* Main application */}
      <main className="min-h-screen min-w-0 lg:ml-64">
        {/* Header */}
        <header className="pw-header sticky top-0 z-30 flex h-[72px] items-center justify-between border-b px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              className="lg:hidden"
              onClick={() => setMobileMenu(true)}
              aria-label="Open navigation"
            >
              <Menu size={23} />
            </button>

            <div className="min-w-0">
              <p className="pw-muted text-xs">PAYWISE AI</p>
              <h2 className="truncate font-bold">{activePage}</h2>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <button
              onClick={toggleTheme}
              className="pw-theme-toggle flex h-10 items-center gap-2 rounded-xl border px-3 text-sm font-medium transition"
              aria-label={`Switch to ${
                theme === "light" ? "night" : "day"
              } mode`}
              title={`Switch to ${
                theme === "light" ? "night" : "day"
              } mode`}
            >
              {theme === "light" ? (
                <Moon size={18} />
              ) : (
                <Sun size={18} />
              )}

              <span className="hidden sm:inline">
                {theme === "light" ? "Night mode" : "Day mode"}
              </span>
            </button>

            <div className="hidden items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-600 sm:flex">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              MVP Preview
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="mx-auto w-full max-w-[1440px] min-w-0 space-y-6 px-4 py-6 sm:px-6 xl:px-8">

          {/* DASHBOARD */}
          {activePage === "Dashboard" && (
            <>
              <section>
                <p className="text-sm font-semibold tracking-wide text-blue-500">
                  CROSS-BORDER PAYMENT INTELLIGENCE
                </p>

                <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
                  Make smarter payment decisions.
                </h1>

                <p className="pw-muted mt-2 max-w-2xl text-sm leading-6">
                  Compare traditional fiat and USDT payment routes to
                  understand fees, exchange rates and recipient payouts.
                </p>
              </section>

              {comparison.error ? (
                <div className="pw-error">{comparison.error}</div>
              ) : result ? (
                <>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                      title="Amount to send"
                      value={formatUSD(sendAmount)}
                      description="Illustrative sending amount"
                      icon={CreditCard}
                    />

                    <StatCard
                      title="Fiat recipient payout"
                      value={formatNGN(result.fiat.recipientReceives)}
                      description="Based on entered assumptions"
                      icon={BarChart3}
                    />

                    <StatCard
                      title="USDT recipient payout"
                      value={formatNGN(result.usdt.recipientReceives)}
                      description="Assumes USD and USDT are 1:1"
                      icon={Zap}
                    />

                    <StatCard
                      title="Payout difference"
                      value={formatNGN(result.difference)}
                      description="Difference between both routes"
                      icon={Activity}
                    />
                  </div>

                  <section className="pw-card p-5 sm:p-6">
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                      <div>
                        <h3 className="text-lg font-bold">
                          Current comparison
                        </h3>

                        <p className="pw-muted mt-1 text-sm">
                          Based on the current sample rates and fees.
                        </p>
                      </div>

                      <button
                        onClick={() => navigate("Compare Routes")}
                        className="pw-primary-button flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold"
                      >
                        Compare routes <ArrowRight size={16} />
                      </button>
                    </div>

                    <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
                      <RouteCard
                        title="Traditional Fiat"
                        route={result.fiat}
                      />

                      <RouteCard
                        title="USDT Route"
                        route={result.usdt}
                        isUsdt
                      />
                    </div>

                    <div className="pw-insight mt-5 rounded-xl p-4 text-sm">
                      <strong>Comparison insight:</strong>{" "}
                      {result.cheaperRoute === "Both routes are equal"
                        ? "Both routes currently provide the same recipient payout."
                        : `${result.cheaperRoute} currently provides the higher recipient payout by ${formatNGN(result.difference)}.`}
                    </div>
                  </section>
                </>
              ) : null}
            </>
          )}

          {/* COMPARE ROUTES */}
          {activePage === "Compare Routes" && (
            <>
              <section>
                <h1 className="text-2xl font-extrabold sm:text-3xl">
                  Compare payment routes
                </h1>

                <p className="pw-muted mt-2 text-sm">
                  Adjust the amount, exchange rates and fees to see how
                  each route affects the recipient payout.
                </p>
              </section>

              <div className="pw-card p-5">
                <label className="text-sm font-semibold">
                  Amount to send (USD)
                </label>

                <input
                  type="number"
                  min="1"
                  step="any"
                  value={sendAmount}
                  onChange={(event) =>
                    setSendAmount(Number(event.target.value))
                  }
                  className="pw-input mt-2 w-full rounded-xl border px-4 py-3 text-lg font-bold sm:max-w-xs"
                />
              </div>

              <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                <div className="pw-card space-y-4 p-5">
                  <h3 className="text-lg font-bold">Traditional Fiat</h3>

                  {(
                    [
                      ["exchangeRate", "Exchange rate (NGN per USD)"],
                      ["providerFee", "Provider fee (USD)"],
                      ["networkFee", "Network fee (USD)"],
                      ["payoutFee", "Payout fee (NGN)"],
                    ] as const
                  ).map(([field, label]) => (
                    <label key={field} className="block text-sm">
                      <span className="pw-muted mb-2 block">{label}</span>

                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={fiat[field]}
                        onChange={(event) =>
                          updateFiat(field, Number(event.target.value))
                        }
                        className="pw-input w-full rounded-xl border px-4 py-3"
                      />
                    </label>
                  ))}
                </div>

                <div className="pw-card space-y-4 p-5">
                  <h3 className="text-lg font-bold">USDT Route</h3>

                  {(
                    [
                      ["exchangeRate", "Exchange rate (NGN per USDT)"],
                      ["providerFee", "Provider fee (USD equivalent)"],
                      ["networkFee", "Network fee (USD equivalent)"],
                      ["payoutFee", "Payout fee (NGN)"],
                    ] as const
                  ).map(([field, label]) => (
                    <label key={field} className="block text-sm">
                      <span className="pw-muted mb-2 block">{label}</span>

                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={usdt[field]}
                        onChange={(event) =>
                          updateUsdt(field, Number(event.target.value))
                        }
                        className="pw-input w-full rounded-xl border px-4 py-3"
                      />
                    </label>
                  ))}
                </div>
              </div>

              {comparison.error ? (
                <div className="pw-error">{comparison.error}</div>
              ) : result ? (
                <>
                  <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                    <RouteCard
                      title="Traditional Fiat"
                      route={result.fiat}
                    />

                    <RouteCard
                      title="USDT Route"
                      route={result.usdt}
                      isUsdt
                    />
                  </div>

                  <div className="pw-verdict rounded-2xl p-5 sm:p-6">
                    <p className="text-sm opacity-80">
                      Recipient payout difference
                    </p>

                    <h2 className="mt-2 break-words text-3xl font-extrabold sm:text-4xl">
                      {formatNGN(result.difference)}
                    </h2>

                    <p className="mt-3 text-sm">
                      {result.cheaperRoute === "Both routes are equal"
                        ? "Both routes currently provide equal payouts."
                        : `${result.cheaperRoute} currently gives the recipient more money.`}
                    </p>
                  </div>

                  <ComparisonHistory comparison={historyComparison} />
                </>
              ) : null}
            </>
          )}

          {/* AI ASSISTANT */}
          {activePage === "AI Assistant" && (
            <>
              <section>
                <h1 className="text-2xl font-extrabold sm:text-3xl">
                  Paywise Assistant
                </h1>

                <p className="pw-muted mt-2 text-sm">
                  Ask questions about the current payment comparison.
                </p>
              </section>

              <div className="pw-card overflow-hidden">
                <div className="pw-divider flex items-center gap-3 border-b p-5">
                  <div className="rounded-xl bg-blue-500/10 p-3 text-blue-500">
                    <Bot size={23} />
                  </div>

                  <div>
                    <h3 className="font-bold">Paywise Assistant</h3>
                    <p className="pw-muted text-xs">
                      Local rule-based demo assistant
                    </p>
                  </div>
                </div>

                <div className="flex max-h-[450px] min-h-[300px] flex-col gap-4 overflow-y-auto p-5">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.role === "user"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-6 sm:max-w-[80%] ${
                          message.role === "user"
                            ? "bg-blue-600 text-white"
                            : "pw-message"
                        }`}
                      >
                        {message.text}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2 px-5 pt-3">
                  {[
                    "Which route is better?",
                    "Explain the fees",
                    "What are the risks of USDT?",
                    "What if exchange rates change?",
                  ].map((question) => (
                    <button
                      key={question}
                      onClick={() => sendMessage(question)}
                      className="pw-chip rounded-full border px-3 py-2 text-xs"
                    >
                      {question}
                    </button>
                  ))}
                </div>

                <form onSubmit={askAssistant} className="flex gap-2 p-5">
                  <input
                    value={chatInput}
                    onChange={(event) => setChatInput(event.target.value)}
                    placeholder="Ask Paywise something..."
                    className="pw-input min-w-0 flex-1 rounded-xl border px-4 py-3 text-sm"
                  />

                  <button
                    type="submit"
                    className="pw-primary-button rounded-xl px-4 text-white"
                    aria-label="Send message"
                  >
                    <Send size={18} />
                  </button>
                </form>

                <p className="pw-muted px-5 pb-5 text-xs">
                  This is a local rule-based assistant, not a connected LLM.
                  It does not provide live financial quotes or execute payments.
                </p>
              </div>
            </>
          )}

          {/* SAVED COMPARISONS */}
          {activePage === "Transactions" && (
            <>
              <section>
                <h1 className="text-2xl font-extrabold sm:text-3xl">
                  Saved comparisons
                </h1>

                <p className="pw-muted mt-2 text-sm">
                  Review and manage your previous payment route analyses.
                </p>
              </section>

              <ComparisonHistory />
            </>
          )}

          {/* SETTINGS */}
          {activePage === "Settings" && (
            <>
              <section>
                <h1 className="text-2xl font-extrabold sm:text-3xl">
                  Settings
                </h1>

                <p className="pw-muted mt-2 text-sm">
                  PAYWISE AI application information.
                </p>
              </section>

              <div className="pw-card space-y-5 p-5 sm:p-6">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="text-blue-500" size={22} />
                  <h3 className="font-bold">Platform information</h3>
                </div>

                {[
                  ["Application", "PAYWISE AI"],
                  ["Purpose", "Cross-border payment intelligence"],
                  ["Calculation engine", "Deterministic TypeScript calculations"],
                  ["Saved comparison storage", "Browser local storage"],
                  ["Integrations", "Demo data only — no live Cleva or blockchain integration"],
                ].map(([label, value]) => (
                  <div key={label} className="pw-divider border-t pt-4 text-sm">
                    <p className="pw-muted mb-1">{label}</p>
                    <strong>{value}</strong>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* FOOTER */}
          <footer className="pw-muted pw-divider border-t pt-5 text-center text-xs leading-6">
            PAYWISE AI · Payment intelligence, not payment execution.
            <br />
            Rates and fees are illustrative inputs, not live quotes or
            financial advice. USDT comparison assumes USD and USDT are
            valued 1:1.
          </footer>
        </div>
      </main>
    </div>
  );
}