/**
 * CheckoutModal — shown when user clicks "Upgrade" on a plan.
 * Lets them:
 *  1. Confirm the plan + model access they'll get
 *  2. Pick a payment method
 *  3. Instantly redirect to a hosted Payment Link OR open the SDK checkout
 *
 * Payment Link env vars (optional — if set, we redirect directly):
 *   VITE_STRIPE_LINK_PRO       e.g. https://buy.stripe.com/xxxx
 *   VITE_STRIPE_LINK_ANNUAL    e.g. https://buy.stripe.com/yyyy
 *   VITE_RAZORPAY_LINK_PRO     e.g. https://rzp.io/l/abc
 *   VITE_RAZORPAY_LINK_ANNUAL  e.g. https://rzp.io/l/def
 */
import React, { useState } from "react";
import {
  Brain,
  Check,
  ChevronRight,
  CreditCard,
  Crown,
  ExternalLink,
  Lock,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import type { PlanTier } from "../../store";
import { useStore } from "../../store";

// ── Payment provider logo pills ───────────────────────────────────────────────
const ProviderBadge: React.FC<{ name: string; color: string }> = ({ name, color }) => (
  <span style={{ color, fontWeight: 800, fontFamily: "var(--font-display)", fontSize: 13 }}>
    {name}
  </span>
);

// ── Model access per tier ─────────────────────────────────────────────────────
const TIER_MODELS: Record<string, { label: string; tier: PlanTier; note?: string }[]> = {
  pro: [
    { label: "Gemini 1.5 Flash", tier: "free" },
    { label: "Gemini 1.5 Pro", tier: "pro" },
    { label: "GPT-4o", tier: "pro" },
    { label: "GPT-4 Turbo", tier: "pro" },
    { label: "Claude 3.5 Sonnet", tier: "pro" },
    { label: "Claude 3 Haiku", tier: "pro" },
  ],
  annual: [
    { label: "Everything in Pro", tier: "pro" },
    { label: "Claude 3 Opus", tier: "annual", note: "Most powerful" },
    { label: "Priority inference queue", tier: "annual" },
  ],
};

// ── Payment methods config ────────────────────────────────────────────────────
interface PayMethod {
  id: string;
  name: string;
  sub: string;
  color: string;
  currency: "USD" | "INR" | "both";
  getLink?: (tier: PlanTier, currency: "USD" | "INR") => string | undefined;
  sdk?: boolean;
}

const PAYMENT_METHODS: PayMethod[] = [
  {
    id: "stripe-link",
    name: "Stripe",
    sub: "Card · Apple Pay · Google Pay",
    color: "#6772E5",
    currency: "both",
    getLink: (tier) => {
      if (tier === "pro") return import.meta.env.VITE_STRIPE_LINK_PRO as string | undefined;
      if (tier === "annual") return import.meta.env.VITE_STRIPE_LINK_ANNUAL as string | undefined;
    },
    sdk: true,
  },
  {
    id: "razorpay-link",
    name: "Razorpay",
    sub: "UPI · NetBanking · Cards (India)",
    color: "#3395FF",
    currency: "INR",
    getLink: (tier) => {
      if (tier === "pro") return import.meta.env.VITE_RAZORPAY_LINK_PRO as string | undefined;
      if (tier === "annual") return import.meta.env.VITE_RAZORPAY_LINK_ANNUAL as string | undefined;
    },
    sdk: true,
  },
  {
    id: "payu",
    name: "PayU",
    sub: "UPI · NetBanking · EMI (India)",
    color: "#FC6A26",
    currency: "INR",
  },
  {
    id: "paypal",
    name: "PayPal",
    sub: "Balance · Credit · Card",
    color: "#003087",
    currency: "USD",
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function initiateRazorpaySdk(
  amount: number,
  currency: "INR" | "USD",
  description: string,
  onSuccess: () => void,
) {
  const script = document.createElement("script");
  script.src = "https://checkout.razorpay.com/v1/checkout.js";
  script.onload = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Rp = (window as any).Razorpay;
    if (!Rp) { alert("Razorpay failed to load."); return; }
    new Rp({
      key: import.meta.env.VITE_RAZORPAY_KEY_ID ?? "rzp_test_placeholder",
      amount: amount * 100,
      currency,
      name: "AuraFlow",
      description,
      handler: onSuccess,
      theme: { color: "#6366f1" },
    }).open();
  };
  document.head.appendChild(script);
}

// ── Main component ─────────────────────────────────────────────────────────────
interface CheckoutModalProps {
  tier: PlanTier;
  pricingUSD: string;
  pricingINR: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  tier,
  pricingUSD,
  pricingINR,
  onClose,
  onSuccess,
}) => {
  const [currency, setCurrency] = useState<"USD" | "INR">("USD");
  const [step, setStep] = useState<"summary" | "method">("summary");
  const [paying, setPaying] = useState(false);

  const { setPlan } = useStore();

  const displayPrice = currency === "INR" ? pricingINR : pricingUSD;
  const tierLabel = tier === "pro" ? "Pro" : "Annual";
  const models = TIER_MODELS[tier] ?? [];

  const availableMethods = PAYMENT_METHODS.filter(
    (m) => m.currency === "both" || m.currency === currency,
  );

  const handlePay = async (method: PayMethod) => {
    setPaying(true);
    try {
      // Check for Payment Link first (no backend needed)
      const link = method.getLink?.(tier, currency);
      if (link) {
        // Redirect to hosted payment page
        window.open(link, "_blank");
        // We can't confirm payment here without a webhook — just show info
        alert("Complete payment in the new tab. Your plan will be upgraded after payment is confirmed.");
        setPaying(false);
        onClose();
        return;
      }

      const amountNum = parseInt(displayPrice.replace(/[^\d]/g, ""), 10);

      if (method.id === "stripe-link" || method.id === "stripe") {
        const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string;
        if (!key || key === "pk_test_placeholder") {
          alert("Stripe not fully configured. Add VITE_STRIPE_PUBLISHABLE_KEY + backend /billing/stripe-session.\n\n(Demo: simulating success)");
          setTimeout(() => { onSuccess(); setPlan(tier); onClose(); }, 500);
          return;
        }
        alert("Opening Stripe Checkout… (integrate backend /billing/stripe-session)");
        setTimeout(() => { onSuccess(); setPlan(tier); onClose(); }, 500);
      } else if (method.id === "razorpay-link" || method.id === "razorpay") {
        initiateRazorpaySdk(
          amountNum,
          currency === "INR" ? "INR" : "USD",
          `AuraFlow ${tierLabel} Plan`,
          () => { onSuccess(); setPlan(tier); onClose(); },
        );
      } else if (method.id === "payu") {
        alert(`PayU payment for ${displayPrice}.\nAdd VITE_PAYU_MERCHANT_KEY and backend for live PayU payments.\n\n(Demo: simulating success)`);
        setTimeout(() => { onSuccess(); setPlan(tier); onClose(); }, 500);
      } else {
        alert(`PayPal: ${tierLabel} plan. Add VITE_PAYPAL_CLIENT_ID for live payments.\n\n(Demo: simulating success)`);
        setTimeout(() => { onSuccess(); setPlan(tier); onClose(); }, 500);
      }
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="checkout-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="checkout-modal">
        {/* Header */}
        <div className="checkout-header">
          <div className="checkout-header-left">
            <div className="checkout-plan-icon">
              {tier === "annual" ? <Sparkles size={18} /> : <Crown size={18} />}
            </div>
            <div>
              <h2 className="checkout-title">Upgrade to {tierLabel}</h2>
              <p className="checkout-sub">
                {step === "summary" ? "Review what you'll get" : "Choose your payment method"}
              </p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {step === "method" && (
              <button className="checkout-back-btn" onClick={() => setStep("summary")}>
                ← Back
              </button>
            )}
            <div className="checkout-currency-toggle">
              <button className={currency === "USD" ? "active" : ""} onClick={() => setCurrency("USD")}>
                $ USD
              </button>
              <button className={currency === "INR" ? "active" : ""} onClick={() => setCurrency("INR")}>
                ₹ INR
              </button>
            </div>
            <button className="checkout-close" onClick={onClose}>
              <X size={14} />
            </button>
          </div>
        </div>

        {step === "summary" ? (
          <>
            {/* Price */}
            <div className="checkout-price-row">
              <span className="checkout-price">{displayPrice}</span>
              <span className="checkout-period">/{tier === "annual" ? "year" : "month"}</span>
              {tier === "annual" && <span className="checkout-saving-pill">Save 29%</span>}
            </div>

            {/* Model access */}
            <div className="checkout-section">
              <div className="checkout-section-title">
                <Brain size={14} />
                Model Access
              </div>
              <div className="checkout-model-grid">
                {models.map((m) => (
                  <div key={m.label} className={`checkout-model-pill ${m.tier}`}>
                    <Check size={10} />
                    <span>{m.label}</span>
                    {m.note && <span className="checkout-model-note">{m.note}</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Features */}
            <div className="checkout-section">
              <div className="checkout-section-title">
                <Zap size={14} />
                What's included
              </div>
              <ul className="checkout-features">
                {tier === "pro" ? (
                  <>
                    <li><Check size={12} className="co-check" /> Unlimited AI generations</li>
                    <li><Check size={12} className="co-check" /> All models (GPT-4o, Claude 3.5, Gemini Pro)</li>
                    <li><Check size={12} className="co-check" /> Unlimited workflow saves</li>
                    <li><Check size={12} className="co-check" /> Export to Python / n8n / Zapier</li>
                    <li><Check size={12} className="co-check" /> API access</li>
                    <li><Check size={12} className="co-check" /> Priority support</li>
                  </>
                ) : (
                  <>
                    <li><Check size={12} className="co-check" /> Everything in Pro</li>
                    <li><Check size={12} className="co-check" /> Claude 3 Opus access</li>
                    <li><Check size={12} className="co-check" /> Team collaboration (5 seats)</li>
                    <li><Check size={12} className="co-check" /> RAG pipelines + vector DB</li>
                    <li><Check size={12} className="co-check" /> Custom integrations</li>
                    <li><Check size={12} className="co-check" /> Dedicated support</li>
                  </>
                )}
              </ul>
            </div>

            <button className="checkout-cta-btn" onClick={() => setStep("method")}>
              Choose Payment Method
              <ChevronRight size={16} />
            </button>
            <p className="checkout-trust">
              <Lock size={11} /> Secure checkout · Cancel anytime · 7-day money-back guarantee
            </p>
          </>
        ) : (
          /* Step 2: Payment methods */
          <div className="checkout-methods">
            <p className="checkout-methods-hint">Select how you'd like to pay {displayPrice}:</p>
            <div className="checkout-methods-list">
              {availableMethods.map((m) => {
                const hasLink = !!m.getLink?.(tier, currency);
                return (
                  <button
                    key={m.id}
                    className="checkout-method-btn"
                    onClick={() => handlePay(m)}
                    disabled={paying}
                  >
                    <div className="checkout-method-left">
                      <CreditCard size={18} style={{ color: m.color }} />
                      <div>
                        <div className="checkout-method-name">
                          <ProviderBadge name={m.name} color={m.color} />
                          {hasLink && (
                            <span className="checkout-link-pill">
                              <ExternalLink size={9} /> Payment Link
                            </span>
                          )}
                        </div>
                        <div className="checkout-method-sub">{m.sub}</div>
                      </div>
                    </div>
                    <div className="checkout-method-price">{displayPrice}</div>
                  </button>
                );
              })}
            </div>
            <p className="checkout-trust" style={{ marginTop: 16 }}>
              <Lock size={11} /> 256-bit SSL encryption · PCI-DSS compliant
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
