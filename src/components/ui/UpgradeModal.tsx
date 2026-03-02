import { Check, Crown, X, Zap } from "lucide-react";
import React from "react";

interface Props {
  onClose: () => void;
}

const FEATURES = [
  "Unlimited AI workflow generations",
  "GPT-4o & Claude 3.5 Sonnet access",
  "Export to Python, n8n, Zapier",
  "RAG pipelines with vector search",
  "Priority support & early access",
  "Team collaboration (up to 5 seats)",
];

export const UpgradeModal: React.FC<Props> = ({ onClose }) => {
  const handleUpgrade = () => {
    // Stripe Checkout redirect — replace with real checkout session endpoint
    const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    if (!stripeKey || stripeKey === "pk_test_placeholder") {
      alert("Stripe not configured yet. Add your VITE_STRIPE_PUBLISHABLE_KEY.");
      return;
    }
    // TODO: call backend POST /billing/checkout-session → redirect to Stripe
    window.open("https://stripe.com", "_blank");
  };

  return (
    <div className="upgrade-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="upgrade-card">
        <button className="upgrade-close" onClick={onClose}>
          <X size={14} />
        </button>

        <div className="upgrade-icon">👑</div>

        <h2 className="upgrade-title">Upgrade to Pro</h2>
        <p className="upgrade-subtitle">
          Unlock the full power of Aura AI — build unlimited workflows, export
          to any platform, and access premium AI models.
        </p>

        <ul className="upgrade-features">
          {FEATURES.map((f) => (
            <li key={f} className="upgrade-feature">
              <Check size={15} className="upgrade-feature-check" />
              <span>{f}</span>
            </li>
          ))}
        </ul>

        <button className="upgrade-cta-btn" onClick={handleUpgrade}>
          <Crown size={16} />
          Upgrade — $12/month
          <Zap size={14} />
        </button>

        <p className="upgrade-note">
          Cancel anytime. 7-day free trial included.
        </p>
      </div>
    </div>
  );
};
