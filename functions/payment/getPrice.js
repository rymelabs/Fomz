import { PRICING } from "../config/pricing.js";

export function getPrice(plan, currency) {
  const currencyPricing = PRICING[currency];

  if (!currencyPricing) {
    throw new Error(`Unsupported currency: ${currency}`);
  }

  const price = currencyPricing[plan];

  if (!price) {
    throw new Error(`Invalid plan: ${plan}`);
  }

  return price;
}
