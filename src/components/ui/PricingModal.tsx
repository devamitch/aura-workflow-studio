import {
  Check,
  CreditCard,
  Crown,
  Infinity as InfinityIcon,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import React, { useState } from "react";
import type { PlanTier } from "../../store";
import { useStore } from "../../store";

// ── Payment provider logos (inline SVG) ──────────────────────────────────────
const RazorpayLogo = () => (
  <svg width="80" height="22" viewBox="0 0 80 22" fill="none">
    <text x="0" y="17" fontFamily="sans-serif" fontSize="14" fontWeight="800" fill="#3395FF">Razorpay</text>
  </svg>
);
const StripeLogo = () => (
  <svg width="50" height="22" viewBox="0 0 50 22" fill="none">
    <text x="0" y="17" fontFamily="sans-serif" fontSize="14" fontWeight="800" fill="#6772E5">Stripe</text>
  </svg>
);
const PayULogo = () => (
  <svg width="44" height="22" viewBox="0 0 44 22" fill="none">
    <text x="0" y="17" fontFamily="sans-serif" fontSize="14" fontWeight="800" fill="#FC6A26">PayU</text>
  </svg>
);
const PayPalLogo = () => (
  <svg width="56" height="22" viewBox="0 0 56 22" fill="none">
    <text x="0" y="17" fontFamily="sans-serif" fontSize="14" fontWeight="800" fill="#003087">PayPal</text>
  </svg>
);

// ── Plans ─────────────────────────────────────────────────────────────────────
interface Plan {
  tier: PlanTier;
  name: string;
  price: string;
  priceINR: string;
  period: string;
  saving?: string;
  badge?: string;
  features: string[];
  cta: string;
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
    cta: "Current Plan",
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
      "All models: GPT-4o, Claude 3.5, Gemini Pro",
      "Unlimited workflow saves",
      "Export to Python / n8n / Zapier",
      "API access",
      "Priority support",
    ],
    cta: "Upgrade to Pro",
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
      "Claude 3 Opus access",
      "Team collaboration (5 seats)",
      "RAG pipelines + vector DB",
      "Custom integrations",
      "Dedicated support",
    ],
    cta: "Get Annual",
  },
];

// ── Credit Packs ──────────────────────────────────────────────────────────────
const CREDIT_PACKS = [
  { credits: 100,  price: "$5",  priceINR: "₹149",  label: "Starter" },
  { credits: 500,  price: "$20", priceINR: "₹599",  label: "Popular", badge: "Best Value" },
  { credits: 2000, price: "$60", priceINR: "₹1,799",label: "Power"   },
];

// ── Region detection (India → Razorpay/PayU first) ────────────────────────────
function detectRegion(): "IN" | "INTL" {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return tz.startsWith("Asia/Kolkata") || tz.startsWith("Asia/Calcutta") ? "IN" : "INTL";
  } catch { return "INTL"; }
}

// ── Payment handler ───────────────────────────────────────────────────────────
function initiateRazorpay(amount: number, currency: "INR" | "USD", description: string, onSuccess: () => void) {
  // Dynamically load Razorpay checkout script
  const script = document.createElement("script");
  script.src = "https://checkout.razorpay.com/v1/checkout.js";
  script.onload = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Razorpay = (window as any).Razorpay;
    if (!Razorpay) { alert("Razorpay failed to load."); return; }
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID ?? "rzp_test_placeholder",
      amount: amount * 100, // paise
      currency,
      name: "AuraFlow",
      description,
      handler: () => { onSuccess(); },
      prefill: {},
      theme: { color: "#6366f1" },
    };
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    new Razorpay(options).open();
  };
  document.head.appendChild(script);
}

function initiateStripe(description: string, onSuccess: () => void) {
  const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  if (!key || key === "pk_test_placeholder") {
    alert("Stripe not configured. Add VITE_STRIPE_PUBLISHABLE_KEY to .env\n\n(In production, this calls your backend to create a Checkout Session.)");
    // Demo: simulate success
    setTimeout(onSuccess, 500);
    return;
  }
  // TODO: call backend POST /billing/stripe-session → redirect
  alert(`Stripe Checkout for: ${description}`);
}

function initiatePayU(amount: number, description: string, onSuccess: () => void) {
  // PayU uses a server-side form POST — placeholder
  alert(`PayU payment for ₹${amount} (${description})\n\nAdd VITE_PAYU_MERCHANT_KEY and backend integration for live payments.`);
  setTimeout(onSuccess, 500);
}

// ── Main Component ────────────────────────────────────────────────────────────
interface Props {
  onClose: () => void;
  defaultTab?: "plans" | "credits";
}

export const PricingModal: React.FC<Props> = ({ onClose, defaultTab = "plans" }) => {
  const [tab, setTab] = useState<"plans" | "credits">(defaultTab);
  const [currency, setCurrency] = useState<"USD" | "INR">(detectRegion() === "IN" ? "INR" : "USD");
  const [paying, setPaying] = useState<string | null>(null);

  const { plan, setPlan, addExtraCredits } = useStore();

  const handleUpgrade = (targetPlan: Plan, provider: string) => {
    const key = `${targetPlan.tier}-${provider}`;
    setPaying(key);

    const priceNum = currency === "INR"
      ? parseInt(targetPlan.priceINR.replace(/[^\d]/g, ""), 10)
      : parseInt(targetPlan.price.replace(/[^\d]/g, ""), 10);

    const onSuccess = () => {
      setPlan(targetPlan.tier);
      setPaying(null);
      alert(`🎉 Upgraded to ${targetPlan.name}! Enjoy unlimited power.`);
      onClose();
    };

    if (provider === "razorpay") {
      initiateRazorpay(priceNum, currency === "INR" ? "INR" : "USD", `AuraFlow ${targetPlan.name}`, onSuccess);
    } else if (provider === "stripe") {
      initiateStripe(`AuraFlow ${targetPlan.name}`, onSuccess);
    } else if (provider === "payu") {
      initiatePayU(priceNum, `AuraFlow ${targetPlan.name}`, onSuccess);
    } else {
      // PayPal placeholder
      alert(`PayPal: ${targetPlan.name} plan — add VITE_PAYPAL_CLIENT_ID for live payments.`);
      setTimeout(onSuccess, 500);
    }
    setPaying(null);
  };

  const handleBuyCredits = (pack: typeof CREDIT_PACKS[0], provider: string) => {
    const key = `credits-${pack.credits}-${provider}`;
    setPaying(key);

    const onSuccess = () => {
      addExtraCredits(pack.credits);
      setPaying(null);
      alert(`✅ ${pack.credits} credits added to your account!`);
    };

    const priceNum = currency === "INR"
      ? parseInt(pack.priceINR.replace(/[^\d]/g, ""), 10)
      : parseInt(pack.price.replace(/[^\d]/g, ""), 10);

    if (provider === "razorpay") {
      initiateRazorpay(priceNum, currency === "INR" ? "INR" : "USD", `${pack.credits} AI Credits`, onSuccess);
    } else if (provider === "stripe") {
      initiateStripe(`${pack.credits} AI Credits`, onSuccess);
    } else if (provider === "payu") {
      initiatePayU(priceNum, `${pack.credits} AI Credits`, onSuccess);
    } else {
      alert(`PayPal credits purchase: ${pack.credits} credits`);
      setTimeout(onSuccess, 500);
    }
    setPaying(null);
  };

  const isIndia = currency === "INR";
  const region = detectRegion();

  return (
    <div className="pricing-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="pricing-modal">
        {/* Header */}
        <div className="pricing-header">
          <div className="pricing-header-left">
            <Crown size={20} color="var(--primary)" />
            <div>
              <h2 className="pricing-title">Upgrade AuraFlow</h2>
              <p className="pricing-sub">Choose the plan that fits your workflow</p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Currency toggle */}
            <div className="pricing-currency-toggle">
              <button className={currency === "USD" ? "active" : ""} onClick={() => setCurrency("USD")}>$ USD</button>
              <button className={currency === "INR" ? "active" : ""} onClick={() => setCurrency("INR")}>₹ INR</button>
            </div>
            <button className="pricing-close" onClick={onClose}><X size={15} /></button>
          </div>
        </div>

        {/* Tabs */}
        <div className="pricing-tabs">
          <button className={tab === "plans" ? "active" : ""} onClick={() => setTab("plans")}>
            <Crown size={14} /> Subscription Plans
          </button>
          <button className={tab === "credits" ? "active" : ""} onClick={() => setTab("credits")}>
            <Zap size={14} /> Buy Credits
          </button>
        </div>

        {/* Plans tab */}
        {tab === "plans" && (
          <div className="pricing-plans-grid">
            {PLANS.map((p) => (
              <div key={p.tier} className={`pricing-plan-card${p.highlighted ? " highlighted" : ""}${plan.tier === p.tier ? " current" : ""}`}>
                {p.badge && <div className="pricing-plan-badge">{p.badge}</div>}
                {p.saving && <div className="pricing-plan-saving">{p.saving}</div>}

                <div className="pricing-plan-name">{p.name}</div>
                <div className="pricing-plan-price">
                  <span className="pricing-price-amount">{currency === "INR" ? p.priceINR : p.price}</span>
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
                  <button className="pricing-downgrade-btn" onClick={() => { setPlan("free"); onClose(); }}>
                    Switch to Free
                  </button>
                ) : (
                  <div className="pricing-pay-section">
                    <p className="pricing-pay-label">Pay with:</p>
                    <div className="pricing-pay-btns">
                      {/* India-first providers */}
                      {isIndia && (
                        <>
                          <button
                            className="pricing-pay-btn razorpay"
                            onClick={() => handleUpgrade(p, "razorpay")}
                            disabled={paying !== null}
                          >
                            <RazorpayLogo />
                          </button>
                          <button
                            className="pricing-pay-btn payu"
                            onClick={() => handleUpgrade(p, "payu")}
                            disabled={paying !== null}
                          >
                            <PayULogo />
                          </button>
                        </>
                      )}
                      <button
                        className="pricing-pay-btn stripe"
                        onClick={() => handleUpgrade(p, "stripe")}
                        disabled={paying !== null}
                      >
                        <StripeLogo />
                      </button>
                      <button
                        className="pricing-pay-btn paypal"
                        onClick={() => handleUpgrade(p, "paypal")}
                        disabled={paying !== null}
                      >
                        <PayPalLogo />
                      </button>
                      {/* INTL users: show India options too */}
                      {!isIndia && region === "INTL" && (
                        <button
                          className="pricing-pay-btn razorpay"
                          onClick={() => handleUpgrade(p, "razorpay")}
                          disabled={paying !== null}
                        >
                          <RazorpayLogo />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Credits tab */}
        {tab === "credits" && (
          <div className="pricing-credits-section">
            <p className="pricing-credits-desc">
              <Sparkles size={14} /> Buy extra AI generation credits on top of your plan.
              Credits never expire.
            </p>
            <div className="pricing-credits-grid">
              {CREDIT_PACKS.map((pack) => (
                <div key={pack.credits} className={`pricing-credit-card${pack.badge ? " popular" : ""}`}>
                  {pack.badge && <div className="pricing-credit-badge">{pack.badge}</div>}
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
                      : `$${(parseInt(pack.price.replace(/[^\d]/g, ""), 10) / pack.credits * 100).toFixed(1)}¢/credit`}
                  </div>
                  <div className="pricing-credit-pays">
                    {isIndia && (
                      <>
                        <button className="credit-pay-btn" onClick={() => handleBuyCredits(pack, "razorpay")}>
                          <span>Razorpay</span>
                        </button>
                        <button className="credit-pay-btn" onClick={() => handleBuyCredits(pack, "payu")}>
                          <span>PayU</span>
                        </button>
                      </>
                    )}
                    <button className="credit-pay-btn primary" onClick={() => handleBuyCredits(pack, "stripe")}>
                      <CreditCard size={12} />
                      <span>Card</span>
                    </button>
                    <button className="credit-pay-btn" onClick={() => handleBuyCredits(pack, "paypal")}>
                      <span>PayPal</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <p className="pricing-credits-note">
              💡 Current balance: <strong>{Math.max(0, (plan.creditsTotal + plan.creditsExtra) - plan.creditsUsed)}</strong> credits remaining
            </p>
          </div>
        )}

        <p className="pricing-footer">
          🔒 Secure payments. Cancel anytime. 7-day money-back guarantee.
        </p>
      </div>
    </div>
  );
};
