/**
 * Native side of the IAP flow.
 *
 *   StoreKit connection → fetch products → request purchase → receive
 *   transaction with receipt → POST receipt to our backend → backend
 *   verifies with Apple + credits the user → we finish the transaction
 *   with Apple so it doesn't redeliver.
 *
 * The backend is the source of truth on whether a transaction was
 * honoured (idempotent on Apple's transaction id), so a flaky
 * network on the redeem call is safe — the StoreKit transaction stays
 * unfinished, and the client retries on next purchase init.
 *
 * Server endpoint:  POST https://www.speeditrades.com/api/native/iap-receipt
 * Server source:    speedi/src/app/api/native/iap-receipt/route.ts
 */

import {
  initConnection,
  endConnection,
  getProducts,
  requestPurchase,
  getAvailablePurchases,
  finishTransaction,
  type Product,
  type ProductPurchase,
} from "react-native-iap";
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
 * Apple hasn't approved the products yet, or if running on Android (we
 * gate the call by Platform.OS upstream but defensive here too).
 */
export async function fetchProducts(): Promise<CreditPack[]> {
  if (Platform.OS !== "ios") return [];
  const products = (await getProducts({ skus: [...IAP_PRODUCT_IDS] })) as Product[];
  return products.map((p) => ({
    productId: p.productId,
    priceLabel: p.localizedPrice,
    priceValue: Number(p.price),
    currency: p.currency,
  }));
}

/**
 * Redeem a single StoreKit purchase against our backend, then finish
 * the transaction with Apple. Returns the new credit balance or throws.
 *
 * `purchase.transactionReceipt` is the base64 receipt blob Apple expects
 * us to pass to verifyReceipt. On iOS this is always present on a
 * successful StoreKit transaction.
 */
async function redeemPurchase(purchase: ProductPurchase): Promise<{
  creditsAdded: number;
  newBalance: number;
}> {
  const receipt = purchase.transactionReceipt;
  if (!receipt) throw new Error("Purchase had no receipt");

  const res = await fetchWithAuth(`${API}/api/native/iap-receipt`, {
    method: "POST",
    body: JSON.stringify({ receipt }),
  });
  const body = await res.json();
  if (!res.ok || !body.ok) {
    throw new Error(body.error || `Receipt redemption failed (${res.status})`);
  }

  // Tell Apple we've honoured the consumable — without this Apple keeps
  // redelivering the transaction on every connection init.
  await finishTransaction({ purchase, isConsumable: true });

  return {
    creditsAdded: body.creditsAdded ?? 0,
    newBalance: body.newBalance ?? 0,
  };
}

/**
 * Buy a credit pack. Wraps the StoreKit dance + backend redemption into
 * a single awaitable. Resolves with the new balance, rejects with a
 * user-presentable Error.
 */
export async function buyCredits(productId: string): Promise<{
  creditsAdded: number;
  newBalance: number;
}> {
  if (Platform.OS !== "ios") {
    throw new Error("In-app purchase is only available on iOS right now.");
  }

  const purchase = (await requestPurchase({ sku: productId })) as ProductPurchase | ProductPurchase[] | undefined;
  // RNIAP can return either a single purchase or an array depending on
  // platform/version. Normalise to the first transaction.
  const tx = Array.isArray(purchase) ? purchase[0] : purchase;
  if (!tx) throw new Error("Purchase did not return a transaction");

  return redeemPurchase(tx);
}

/**
 * Replay every StoreKit transaction in the user's purchase history
 * through our backend. Used by Profile → "Restore Purchases" (Apple
 * requires this affordance for consumable apps). Backend is idempotent
 * so replaying a transaction we've already credited is a no-op.
 *
 * Returns the count of transactions that ACTUALLY granted new credits
 * (already-credited transactions don't count). The new balance is also
 * returned so the caller can update its UI.
 */
export async function restorePurchases(): Promise<{
  restoredCount: number;
  newBalance: number;
}> {
  if (Platform.OS !== "ios") {
    return { restoredCount: 0, newBalance: 0 };
  }

  const purchases = (await getAvailablePurchases()) as ProductPurchase[];
  let restoredCount = 0;
  let latestBalance = 0;

  for (const p of purchases) {
    try {
      const { creditsAdded, newBalance } = await redeemPurchase(p);
      if (creditsAdded > 0) restoredCount += 1;
      latestBalance = newBalance;
    } catch (e) {
      // Skip individual failures rather than failing the whole restore;
      // log so we can spot patterns.
      console.log("Restore: failed to redeem one purchase", e);
    }
  }

  return { restoredCount, newBalance: latestBalance };
}
