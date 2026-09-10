export const ACCOUNT_TYPES = [
  { value: "restaurant", label: "Restaurant" },
  { value: "grocery_co_op", label: "Grocery / Co-op" },
  { value: "farmers_market_vendor", label: "Farmers Market Vendor" },
  { value: "distributor", label: "Distributor" },
  { value: "other", label: "Other" },
];

export const DELIVERY_METHODS = [
  { value: "self_delivery", label: "Self Delivery" },
  { value: "customer_pickup", label: "Customer Pickup" },
  { value: "third_party_courier", label: "Third Party Courier" },
];

export const PAYMENT_TERMS = [
  { value: "due_on_delivery", label: "Due on Delivery" },
  { value: "net_15", label: "Net 15" },
  { value: "net_30", label: "Net 30" },
  { value: "other", label: "Other" },
];

export const FREQUENCY_OPTIONS = [
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Biweekly" },
  { value: "monthly", label: "Monthly" },
  { value: "custom", label: "Custom" },
  { value: "none", label: "None" },
];

export const ORDER_UNITS = [
  { value: "lbs", label: "lbs" },
  { value: "oz", label: "oz" },
  { value: "cases", label: "cases" },
];

export const DELIVERY_STATUS = [
  { value: "scheduled", label: "Scheduled" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

export const INVOICE_STATUS = [
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "paid", label: "Paid" },
  { value: "overdue", label: "Overdue" },
];

export const MUSHROOM_SPECIES = [
  { value: "oyster", label: "Oyster" },
  { value: "shiitake", label: "Shiitake" },
  { value: "lions_mane", label: "Lion's Mane" },
  { value: "wine_cap", label: "Wine Cap" },
  { value: "button", label: "Button" },
  { value: "portobello", label: "Portobello" },
  { value: "reishi", label: "Reishi" },
  { value: "maitake", label: "Maitake" },
  { value: "other", label: "Other" },
];

export function getAccountTypeLabel(value) {
  return ACCOUNT_TYPES.find(a => a.value === value)?.label || value;
}

export function getDeliveryMethodLabel(value) {
  return DELIVERY_METHODS.find(d => d.value === value)?.label || value;
}

export function getPaymentTermsLabel(value) {
  return PAYMENT_TERMS.find(p => p.value === value)?.label || value;
}

export function getFrequencyLabel(value) {
  return FREQUENCY_OPTIONS.find(f => f.value === value)?.label || value;
}

export function getSpeciesLabel(value) {
  return MUSHROOM_SPECIES.find(s => s.value === value)?.label || value;
}

export function getUnitLabel(value) {
  return ORDER_UNITS.find(u => u.value === value)?.label || value;
}

// An invoice is overdue if: invoice_status is "sent", no payment_received_date,
// and delivery_date is more than 30 days past
export function isInvoiceOverdue(order) {
  if (!order) return false;
  if (order.invoice_status !== "sent") return false;
  if (order.payment_received_date) return false;
  if (!order.delivery_date) return false;
  const daysPast = Math.floor((new Date() - new Date(order.delivery_date)) / 86400000);
  return daysPast > 30;
}

export function daysPastDelivery(order) {
  if (!order.delivery_date) return null;
  return Math.floor((new Date() - new Date(order.delivery_date)) / 86400000);
}

// Available lbs on a flush = yield_lbs - allocated_lbs
export function getAvailableLbs(flush) {
  if (!flush) return 0;
  return Math.max(0, (flush.yield_lbs || 0) - (flush.allocated_lbs || 0));
}