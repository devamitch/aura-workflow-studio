import {
  Check,
  Crown,
  Infinity as InfinityIcon,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import React, { useState } from "react";
import type { PlanTier } from "../../store";
import { useStore } from "../../store";
import { CheckoutModal } from "./CheckoutModal";

interface Plan {
  tier: PlanTier;
  name: string;
  price: string;
  priceINR: string;
  period: string;
  saving?: string;
  badge?: string;
  features: string[];
  highlighted?: boolean;
}

const PLANS: Plan[] = [
  {
    tier: "free",
    name: "Free",
    price: "$0",
    priceINR: "₹0",
    period: "/forever",
    features: [
      "20 AI generations/month",
      "Gemini 1.5 Flash only",
      "5 workflow saves",
      "All visual nodes",
      "Community support",
    ],
  },
  {
    tier: "pro",
    name: "Pro",
    price: "$35",
    priceINR: "₹999",
    period: "/month",
    badge: "Most Popular",
    highlighted: true,
    features: [
      "Unlimited AI generations",
      "GPT-4o, Claude 3.5 Sonnet, Gemini Pro",
      "Unlimited workflow saves",
      "Export to Python / n8n / Zapier",
      "API access & Priority support",
    ],
  },
  {
    tier: "annual",
    name: "Annual",
    price: "$299",
    priceINR: "₹7,999",
    period: "/year",
    saving: "Save 29%",
    features: [
      "Everything in Pro",
      "Claude 3 Opus (most powerful)",
      "Team collaboration — 5 seats",
      "RAG pipelines + vector DB",
      "Dedicated support",
    ],
  },
];

const CREDIT_PACKS = [
  { credits: 100, price: "$5", priceINR: "₹149", label: "Starter" },
  {
    credits: 500,
    price: "$20",
    priceINR: "₹599",
    label: "Popular",
    badge: "Best Value",
  },
  { credits: 2000, price: "$60", priceINR: "₹1,799", label: "Power" },
];

function detectRegion(): "IN" | "INTL" {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return tz.startsWith("Asia/Kolkata") || tz.startsWith("Asia/Calcutta")
      ? "IN"
      : "INTL";
  } catch {
    return "INTL";
  }
}

function handleCreditPay(
  pack: (typeof CREDIT_PACKS)[0],
  provider: string,
  currency: "USD" | "INR",
  addExtraCredits: (n: number) => void,
) {
  const amount = parseInt(
    (currency === "INR" ? pack.priceINR : pack.price).replace(/[^\d]/g, ""),
    10,
  );
  const onSuccess = () => {
    addExtraCredits(pack.credits);
    alert(`✅ ${pack.credits} credits added to your account!`);
  };

  if (provider === "razorpay") {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const Rp = (window as any).Razorpay;
      if (!Rp) {
        alert("Razorpay failed to load.");
        return;
      }
      new Rp({
        key: import.meta.env.VITE_RAZORPAY_KEY_ID ?? "rzp_test_placeholder",
        amount: amount * 100,
        currency: currency === "INR" ? "INR" : "USD",
        name: "AuraStudio Credits",
        description: `${pack.credits} AI Credits`,
        handler: onSuccess,
        theme: { color: "#6366f1" },
      }).open();
    };
    document.head.appendChild(script);
  } else if (provider === "stripe") {
    const stripeLink = (import.meta.env as Record<string, string>)[
      `VITE_STRIPE_LINK_CREDITS_${pack.credits}`
    ];
    if (stripeLink) {
      window.open(stripeLink, "_blank");
    } else {
      alert(`(Demo) Stripe card checkout for ${pack.credits} credits.`);
      setTimeout(onSuccess, 500);
    }
  } else {
    alert(`(Demo) ${provider} payment for ${pack.credits} credits.`);
    setTimeout(onSuccess, 500);
  }
}

interface Props {
  onClose: () => void;
  defaultTab?: "plans" | "credits";
}

export const PricingModal: React.FC<Props> = ({
  onClose,
  defaultTab = "plans",
}) => {
  const [tab, setTab] = useState<"plans" | "credits">(defaultTab);
  const [currency, setCurrency] = useState<"USD" | "INR">(
    detectRegion() === "IN" ? "INR" : "USD",
  );
  const [checkoutPlan, setCheckoutPlan] = useState<Plan | null>(null);

  const { plan, setPlan, addExtraCredits } = useStore();
  const isIndia = currency === "INR";

  if (checkoutPlan) {
    return (
      <CheckoutModal
        tier={checkoutPlan.tier}
        pricingUSD={checkoutPlan.price}
        pricingINR={checkoutPlan.priceINR}
        onClose={() => setCheckoutPlan(null)}
        onSuccess={() => {
          alert(`🎉 Upgraded to ${checkoutPlan.name}! Enjoy unlimited power.`);
          onClose();
        }}
      />
    );
  }

  return (
    <div
      className="pricing-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="pricing-modal">
        <div className="pricing-header">
          <div className="pricing-header-left">
            <Crown size={20} color="var(--primary)" />
            <div>
              <h2 className="pricing-title">Upgrade AuraStudio</h2>
              <p className="pricing-sub">
                Choose the plan that fits your workflow
              </p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div className="pricing-currency-toggle">
              <button
                className={currency === "USD" ? "active" : ""}
                onClick={() => setCurrency("USD")}
              >
                $ USD
              </button>
              <button
                className={currency === "INR" ? "active" : ""}
                onClick={() => setCurrency("INR")}
              >
                ₹ INR
              </button>
            </div>
            <button className="pricing-close" onClick={onClose}>
              <X size={15} />
            </button>
          </div>
        </div>

        <div className="pricing-tabs">
          <button
            className={tab === "plans" ? "active" : ""}
            onClick={() => setTab("plans")}
          >
            <Crown size={14} /> Subscription Plans
          </button>
          <button
            className={tab === "credits" ? "active" : ""}
            onClick={() => setTab("credits")}
          >
            <Zap size={14} /> Buy Credits
          </button>
        </div>

        {tab === "plans" && (
          <div className="pricing-plans-grid">
            {PLANS.map((p) => (
              <div
                key={p.tier}
                className={`pricing-plan-card${p.highlighted ? " highlighted" : ""}${plan.tier === p.tier ? " current" : ""}`}
              >
                {p.badge && <div className="pricing-plan-badge">{p.badge}</div>}
                {p.saving && (
                  <div className="pricing-plan-saving">{p.saving}</div>
                )}
                <div className="pricing-plan-name">{p.name}</div>
                <div className="pricing-plan-price">
                  <span className="pricing-price-amount">
                    {currency === "INR" ? p.priceINR : p.price}
                  </span>
                  <span className="pricing-price-period">{p.period}</span>
                </div>
                <ul className="pricing-features">
                  {p.features.map((f) => (
                    <li key={f}>
                      <Check size={13} className="pricing-check" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                {plan.tier === p.tier ? (
                  <div className="pricing-current-badge">✓ Current Plan</div>
                ) : p.tier === "free" ? (
                  <button
                    className="pricing-downgrade-btn"
                    onClick={() => {
                      setPlan("free");
                      onClose();
                    }}
                  >
                    Switch to Free
                  </button>
                ) : (
                  <button
                    className="pricing-upgrade-cta"
                    onClick={() => setCheckoutPlan(p)}
                  >
                    {p.tier === "annual" ? (
                      <Sparkles size={14} />
                    ) : (
                      <Crown size={14} />
                    )}
                    Get {p.name} →
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {tab === "credits" && (
          <div className="pricing-credits-section">
            <p className="pricing-credits-desc">
              <Sparkles size={14} /> Buy extra AI generation credits on top of
              your plan. Credits never expire.
            </p>
            <div className="pricing-credits-grid">
              {CREDIT_PACKS.map((pack) => (
                <div
                  key={pack.credits}
                  className={`pricing-credit-card${pack.badge ? " popular" : ""}`}
                >
                  {pack.badge && (
                    <div className="pricing-credit-badge">{pack.badge}</div>
                  )}
                  <div className="pricing-credit-amount">
                    <InfinityIcon size={0} />
                    <span className="pricing-credit-num">{pack.credits}</span>
                    <span className="pricing-credit-label">credits</span>
                  </div>
                  <div className="pricing-credit-price">
                    {currency === "INR" ? pack.priceINR : pack.price}
                  </div>
                  <div className="pricing-credit-per">
                    {currency === "INR"
                      ? `₹${(parseInt(pack.priceINR.replace(/[^\d]/g, ""), 10) / pack.credits).toFixed(1)}/credit`
                      : `$${((parseInt(pack.price.replace(/[^\d]/g, ""), 10) / pack.credits) * 100).toFixed(1)}¢/credit`}
                  </div>
                  <div className="pricing-credit-pays">
                    {isIndia && (
                      <>
                        <button
                          className="credit-pay-btn"
                          onClick={() =>
                            handleCreditPay(
                              pack,
                              "razorpay",
                              currency,
                              addExtraCredits,
                            )
                          }
                        >
                          Razorpay
                        </button>
                        <button
                          className="credit-pay-btn"
                          onClick={() =>
                            handleCreditPay(
                              pack,
                              "payu",
                              currency,
                              addExtraCredits,
                            )
                          }
                        >
                          PayU
                        </button>
                      </>
                    )}
                    <button
                      className="credit-pay-btn primary"
                      onClick={() =>
                        handleCreditPay(
                          pack,
                          "stripe",
                          currency,
                          addExtraCredits,
                        )
                      }
                    >
                      Card
                    </button>
                    <button
                      className="credit-pay-btn"
                      onClick={() =>
                        handleCreditPay(
                          pack,
                          "paypal",
                          currency,
                          addExtraCredits,
                        )
                      }
                    >
                      PayPal
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <p className="pricing-credits-note">
              💡 Current balance:{" "}
              <strong>
                {Math.max(
                  0,
                  plan.creditsTotal + plan.creditsExtra - plan.creditsUsed,
                )}
              </strong>{" "}
              credits remaining
            </p>
          </div>
        )}

        <p className="pricing-footer">
          🔒 Secure payments · Cancel anytime · 7-day money-back guarantee
        </p>
      </div>
    </div>
  );
};
