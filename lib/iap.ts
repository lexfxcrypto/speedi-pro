/**
 * Native side of the IAP flow (expo-iap).
 *
 *   StoreKit connection → fetch products → request purchase → grab the
 *   base64 receipt → POST to our backend → backend verifies with Apple
 *   + credits the user → finish the transaction so it doesn't redeliver.
 *
 * The backend is the source of truth on whether a transaction was
 * honoured (idempotent on Apple's transaction id), so a flaky network
 * on the redeem call is safe — the StoreKit transaction stays
 * unfinished and the client retries on next purchase init.
 *
 * Server endpoint:  POST https://www.speeditrades.com/api/native/iap-receipt
 * Server source:    speedi/src/app/api/native/iap-receipt/route.ts
 */

import {
  initConnection,
  endConnection,
  fetchProducts as expoFetchProducts,
  requestPurchase,
  finishTransaction,
  type Product,
  type Purchase,
} from "expo-iap";
import { getReceiptDataIOS, requestReceiptRefreshIOS } from "expo-iap";
import { Platform } from "react-native";
import { fetchWithAuth } from "./auth";
import { IAP_PRODUCT_IDS } from "./featureFlags";

const API = "https://www.speeditrades.com";

export type CreditPack = {
  productId: string;
  /** StoreKit-localised price (e.g. "£24.99") — always trust this over hardcoding. */
  priceLabel: string;
  /** Underlying numeric price for sorting + analytics. */
  priceValue: number;
  currency: string;
};

export async function connectIap(): Promise<void> {
  await initConnection();
}

export async function disconnectIap(): Promise<void> {
  try {
    await endConnection();
  } catch {
    // endConnection occasionally throws on already-disconnected; safe to ignore.
  }
}

/**
 * Fetch the configured products from StoreKit. Returns an empty list if
 * Apple hasn't approved the products yet, or if running on Android.
 */
export async function fetchProducts(): Promise<CreditPack[]> {
  if (Platform.OS !== "ios") return [];
  const result = await expoFetchProducts({ skus: [...IAP_PRODUCT_IDS], type: "in-app" });
  const products = (result ?? []) as Product[];
  return products.map((p) => ({
    productId: p.id,
    priceLabel: p.displayPrice,
    priceValue: p.price ?? 0,
    currency: p.currency,
  }));
}

/**
 * Pull the app's base64 receipt blob. After a first purchase the file
 * on disk can be empty until App Store sync writes it — in that case
 * fall through to requestReceiptRefreshIOS() which calls AppStore.sync()
 * before re-reading.
 */
async function readReceipt(): Promise<string> {
  const initial = await getReceiptDataIOS();
  if (initial) return initial;
  return requestReceiptRefreshIOS();
}

async function redeemReceipt(): Promise<{ creditsAdded: number; newBalance: number }> {
  const receipt = await readReceipt();
  if (!receipt) throw new Error("No receipt available");

  const res = await fetchWithAuth(`${API}/api/native/iap-receipt`, {
    method: "POST",
    body: JSON.stringify({ receipt }),
  });
  const body = await res.json();
  if (!res.ok || !body.ok) {
    throw new Error(body.error || `Receipt redemption failed (${res.status})`);
  }

  return {
    creditsAdded: body.creditsAdded ?? 0,
    newBalance: body.newBalance ?? 0,
  };
}

/**
 * Buy a credit pack. Wraps the StoreKit dance + backend redemption
 * into a single awaitable. Resolves with the new balance, rejects
 * with a user-presentable Error.
 */
export async function buyCredits(productId: string): Promise<{
  creditsAdded: number;
  newBalance: number;
}> {
  if (Platform.OS !== "ios") {
    throw new Error("In-app purchase is only available on iOS right now.");
  }

  const result = await requestPurchase({
    request: { ios: { sku: productId } },
    type: "in-app",
  });

  const purchase = (Array.isArray(result) ? result[0] : result) as Purchase | undefined;
  if (!purchase) throw new Error("Purchase did not return a transaction");

  const redemption = await redeemReceipt();

  // Tell Apple we've honoured the consumable — without this Apple
  // keeps redelivering the transaction on every connection init.
  await finishTransaction({ purchase, isConsumable: true });

  return redemption;
}

/**
 * Replay the user's purchase history through our backend. Apple
 * requires this affordance for consumable apps. Backend is idempotent
 * — replaying a transaction we've already credited is a no-op.
 *
 * Returns the count of NEW credits granted by this call and the new
 * balance for UI sync.
 */
export async function restorePurchases(): Promise<{
  restoredCount: number;
  newBalance: number;
}> {
  if (Platform.OS !== "ios") {
    return { restoredCount: 0, newBalance: 0 };
  }
  try {
    const { creditsAdded, newBalance } = await redeemReceipt();
    return { restoredCount: creditsAdded > 0 ? 1 : 0, newBalance };
  } catch (e) {
    console.log("Restore failed:", e);
    return { restoredCount: 0, newBalance: 0 };
  }
}
