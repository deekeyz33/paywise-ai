
"use client";

import { useEffect, useState } from "react";
import { Bookmark, Trash2, History, CheckCircle2 } from "lucide-react";
import type { PaymentResult } from "@/lib/calculations";

interface Comparison {
  fiat: PaymentResult;
  stablecoin: PaymentResult;
  difference: number;
  cheaperRoute: string;
}

interface SavedComparison {
  id: string;
  savedAt: string;
  fiat: PaymentResult;
  stablecoin: PaymentResult;
  difference: number;
  cheaperRoute: string;
}

interface Props {
  comparison?: Comparison | null;
}

const STORAGE_KEY = "paywise_saved_comparisons";

const formatNGN = (amount: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(amount);

export default function ComparisonHistory({ comparison }: Props) {
  const [history, setHistory] = useState<SavedComparison[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: unknown = JSON.parse(stored);

        if (Array.isArray(parsed)) {
          setHistory(parsed);
        }
      }
    } catch {
      setHistory([]);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!loaded) return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch {
      setMessage("Unable to save. Your browser storage may be full.");
    }
  }, [history, loaded]);

  function saveComparison() {
    if (!comparison) return;

    const record: SavedComparison = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      savedAt: new Date().toISOString(),
      fiat: comparison.fiat,
      stablecoin: comparison.stablecoin,
      difference: comparison.difference,
      cheaperRoute: comparison.cheaperRoute,
    };

    setHistory((previous) => [record, ...previous]);
    setMessage("Comparison saved successfully.");
  }

  function deleteComparison(id: string) {
    setHistory((previous) => previous.filter((item) => item.id !== id));
    setMessage("Saved comparison deleted.");
  }

  function clearHistory() {
    setHistory([]);
    setMessage("Comparison history cleared.");
  }

  return (
    <section className="history-section">
      {comparison && (
        <div className="history-save">
          <div>
            <h3>Save this comparison</h3>
            <p>Keep these results for future reference.</p>
          </div>

          <button className="history-save-button" onClick={saveComparison}>
            <Bookmark size={16} />
            Save comparison
          </button>
        </div>
      )}

      <div className="history-heading">
        <div>
          <h2>
            <History size={20} />
            Saved Comparisons
          </h2>
          <p>Your previous payment route analyses.</p>
        </div>

        {history.length > 0 && (
          <button className="history-clear" onClick={clearHistory}>
            Clear all
          </button>
        )}
      </div>

      {message && (
        <p className="history-message" role="status">
          <CheckCircle2 size={15} />
          {message}
        </p>
      )}

      {!loaded ? (
        <p className="history-empty">Loading saved comparisons...</p>
      ) : history.length === 0 ? (
        <div className="history-empty">
          <History size={30} />
          <h3>No saved comparisons yet</h3>
          <p>Compare payment routes and save the results here.</p>
        </div>
      ) : (
        <div className="history-list">
          {history.map((item) => (
            <article className="history-card" key={item.id}>
              <div className="history-card-top">
                <div>
                  <span className="history-date">
                    {new Date(item.savedAt).toLocaleString()}
                  </span>
                  <h3>
                    {item.fiat.sendAmount.toLocaleString("en-US", {
                      style: "currency",
                      currency: "USD",
                    })}{" "}
                    comparison
                  </h3>
                </div>

                <button
                  className="history-delete"
                  onClick={() => deleteComparison(item.id)}
                  aria-label="Delete saved comparison"
                  title="Delete comparison"
                >
                  <Trash2 size={17} />
                </button>
              </div>

              <div className="history-results">
                <div>
                  <span>Fiat payout</span>
                  <strong>{formatNGN(item.fiat.recipientReceives)}</strong>
                </div>

                <div>
                  <span>USDT payout</span>
                  <strong>
                    {formatNGN(item.stablecoin.recipientReceives)}
                  </strong>
                </div>

                <div>
                  <span>Difference</span>
                  <strong>{formatNGN(item.difference)}</strong>
                </div>
              </div>

              <p className="history-verdict">
                Better payout: <strong>{item.cheaperRoute}</strong>
              </p>
            </article>
          ))}
        </div>
      )}

      <p className="history-disclaimer">
        Saved records are stored locally in this browser. They are comparison
        records, not proof of completed payments.
      </p>
    </section>
  );
}
