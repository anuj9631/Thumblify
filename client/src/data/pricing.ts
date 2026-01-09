import type { IPricing } from "../types";

export const pricingData: IPricing[] = [
  {
    name: "Basic",
    price: 29,
    period: "month",
    features: [
      "50 AI Thumbnails/mo",
      "Basic Templates",
      "Standard Resolution",
      "No Watermark",
      "Email Support",
    ],
    mostPopular: false,
  },
  {
    name: "Pro",
    price: 79,
    period: "month",
    features: [
      "Unlimited AI thumbnails",
      "Premium templates",
      "4K resolution exports",
      "A/B testing tools",
      "Priority support",
      "Custom fonts",
      "Brand kit analysis",
    ],
    mostPopular: true,
  },
  {
    name: "Enterprise",
    price: 199,
    period: "month",
    features: [
      "Everything in Pro",
      "API access",
      "Team collaboration",
      "Custom branding",
      "Dedicated account manager",
    ],
    mostPopular: false,
  },
];
