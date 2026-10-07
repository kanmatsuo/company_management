import { t, type Locale } from "@/lib/i18n";

/** Short words for the codes the API sends (statuses, kinds, reasons, results), so
 * pages never show a raw code like UNASSIGNED_CARD. Korean comes from ko-ui.ts. */
const CODES: Record<string, string> = {
  // People, cards, stores, wallets
  ACTIVE: "Active",
  ON_LEAVE: "On leave",
  SUSPENDED: "Suspended",
  TERMINATED: "Terminated",
  BLOCKED: "Blocked",
  RETIRED: "Retired",
  CLOSED: "Closed",
  FROZEN: "Frozen",
  // Card assignments
  RETURNED: "Returned",
  REPLACED: "Replaced",
  DEVELOPER_LEFT: "Developer left",
  DEVELOPER_DELETED: "Developer record deleted",
  // Attendance
  IN: "In",
  OUT: "Out",
  BOTH: "In and out",
  SCAN: "Scan",
  RFID: "Door scan",
  MANUAL: "Manual",
  PRESENT: "Present",
  INCOMPLETE: "Incomplete",
  // Money
  DEPOSIT: "Deposit",
  PURCHASE: "Purchase",
  REFUND: "Refund",
  ADJUSTMENT: "Adjustment",
  // Sales and stock
  DRAFT: "Draft",
  CONFIRMED: "Paid",
  CANCELLED: "Cancelled",
  SALE: "Sale",
  BOOKING: "Booking",
  PRODUCT: "Product",
  SERVICE: "Service",
  RENTAL: "Court",
  INITIAL_STOCK: "Initial stock",
  RESTOCK: "Restock",
  RETURN: "Return",
  DAMAGE: "Damage / loss",
  // Readers and scans
  ATTENDANCE: "Door",
  TILL: "Till reader",
  ENROLL: "Card assign reader",
  ACCEPTED: "Accepted",
  DUPLICATE: "Duplicate",
  UNKNOWN_CARD: "Unknown card",
  UNASSIGNED_CARD: "Card not assigned",
  BLOCKED_CARD: "Card blocked",
  RETIRED_CARD: "Card retired",
  INACTIVE_DEVELOPER: "Developer not active",
  OK: "Handled",
  REJECTED: "Unknown device or address",
  INVALID: "Invalid packet",
  REFUSED: "Connection refused",
  ERROR: "Server error",
  // Roles
  ADMIN: "Admin",
  BOSS: "Boss",
  MANAGER: "Manager",
  FINANCE_MANAGER: "Finance manager",
  BUILDING_MANAGER: "Building manager",
  BUILDING_OWNER: "Building owner",
  DEVELOPER: "Developer",
  SELLER: "Seller",
};

/** The word for an API code in the page's language ("—" when empty). */
export function codeLabel(locale: Locale, code: string | null | undefined) {
  if (!code) return "—";
  return t(locale, CODES[code] ?? code);
}
