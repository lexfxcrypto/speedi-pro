/**
 * Sheet that lets a pro buy a credit pack via Apple IAP. Used from:
 *   - Rewards tab (replaces the "manage on speedi.co.uk" copy when the
 *     SHOW_IAP_CREDITS flag is on)
 *   - NO_CREDITS alerts in Messages / Waiting / Quotes (the user taps
 *     "Buy credits" → this sheet appears instead of an external link)
 *
 * Prices come from StoreKit (`localizedPrice`) — never hardcode. Apple
 * rejects apps that display a price that doesn't match what the
 * purchase confirmation modal shows.
 */

import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  buyCredits,
  connectIap,
  disconnectIap,
  fetchProducts,
  type CreditPack,
} from "../lib/iap";
import { IAP_PRODUCT_IDS } from "../lib/featureFlags";
import { useT } from "../lib/i18n";

const CREDIT_AMOUNT_BY_PRODUCT: Record<string, number> = {
  "com.speeditrades.speedipro.credits_10": 10,
  "com.speeditrades.speedipro.credits_25": 25,
  "com.speeditrades.speedipro.credits_50": 50,
};

function creditCountFor(productId: string): number {
  return CREDIT_AMOUNT_BY_PRODUCT[productId] ?? 0;
}

/**
 * Per-credit price in the pack's own currency. This used to prefix a
 * hardcoded "£", which was wrong for anyone whose App Store is not in
 * pounds — a Thai storefront showed a per-credit price in pounds
 * beside a pack price in baht.
 * Falls back to the bare number if Intl cannot format the currency.
 */
function formatPerCredit(value: number, currency: string, lang: string): string {
  try {
    return new Intl.NumberFormat(lang === "th" ? "th-TH" : "en-GB", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return value.toFixed(2);
  }
}

export default function CreditsPurchaseSheet({
  visible,
  onClose,
  onPurchased,
}: {
  visible: boolean;
  onClose: () => void;
  onPurchased?: (newBalance: number) => void;
}) {
  const { t, lang } = useT();
  const [products, setProducts] = useState<CreditPack[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [buying, setBuying] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  // Tracks whether we've ever called connectIap on this mount. Critical:
  // calling disconnectIap (→ endConnection) before initConnection has
  // landed throws an iOS-level guard violation that JS can't catch —
  // crashes the whole app, not just the sheet. The previous code fired
  // disconnectIap on every render where !visible, including the first
  // mount, which was the cause of the rewards-tab crash in 1.0.1/1.0.2.
  const iapConnectedRef = useRef(false);

  // Initialise IAP connection on first open, tear down on close.
  useEffect(() => {
    if (!visible) {
      // Only attempt disconnect if we actually connected first. On
      // first mount this is false → no native call → no guard trip.
      if (iapConnectedRef.current) {
        iapConnectedRef.current = false;
        disconnectIap();
      }
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setLoadingProducts(true);
        setLoadError(null);
        await connectIap();
        iapConnectedRef.current = true;
        const fetched = await fetchProducts();
        if (cancelled) return;
        // Sort by credit count ascending so the smallest pack renders first.
        fetched.sort((a, b) => creditCountFor(a.productId) - creditCountFor(b.productId));
        setProducts(fetched);
        if (fetched.length === 0) {
          setLoadError(t("modals.creditsUnavailable"));
        }
      } catch (e) {
        if (cancelled) return;
        console.log("IAP product fetch failed:", e);
        setLoadError(t("modals.creditsLoadFailed"));
      } finally {
        if (!cancelled) setLoadingProducts(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [visible]);

  const handleBuy = async (productId: string) => {
    if (buying) return;
    setBuying(productId);
    try {
      const { creditsAdded, newBalance } = await buyCredits(productId);
      onPurchased?.(newBalance);
      Alert.alert(
        t("modals.creditsAddedTitle"),
        t(creditsAdded === 1 ? "modals.creditsAddedOne" : "modals.creditsAddedOther", {
          count: creditsAdded,
          balance: newBalance,
        }),
        [{ text: t("common.done"), onPress: onClose }],
      );
    } catch (e) {
      const message = e instanceof Error ? e.message : t("common.retry");
      // Suppress the noisy "user cancelled" path — Apple uses code E_USER_CANCELLED
      // on react-native-iap. Cheap heuristic: ignore messages with "cancel".
      if (!/cancel/i.test(message)) {
        Alert.alert(t("modals.creditsPurchaseFailed"), message);
      }
    } finally {
      setBuying(null);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.handle} />
          <View style={styles.titleRow}>
            <Text style={styles.title}>{t("modals.creditsTitle")}</Text>
            <View style={styles.introBadge}>
              <Text style={styles.introBadgeText}>{t("modals.creditsIntroBadge")}</Text>
            </View>
          </View>
          <Text style={styles.subtitle}>{t("modals.creditsSubtitle")}</Text>

          {loadingProducts ? (
            <View style={styles.loadingBlock}>
              <ActivityIndicator color="#E64A19" />
            </View>
          ) : loadError ? (
            <Text style={styles.errorText}>{loadError}</Text>
          ) : (
            <ScrollView style={{ maxHeight: 360 }} contentContainerStyle={{ paddingVertical: 8 }}>
              {products.map((p) => {
                const credits = creditCountFor(p.productId);
                const isBuying = buying === p.productId;
                const isAnyBuying = buying !== null;
                return (
                  <TouchableOpacity
                    key={p.productId}
                    style={[styles.pack, isBuying && styles.packBusy]}
                    onPress={() => handleBuy(p.productId)}
                    disabled={isAnyBuying}
                    activeOpacity={0.85}
                  >
                    <View style={styles.packLeft}>
                      <Text style={styles.packCredits}>{t("modals.creditsPackCount", { count: credits })}</Text>
                      <Text style={styles.packDetail}>
                        {t("modals.creditsPerCredit", {
                          price: formatPerCredit(p.priceValue / credits, p.currency, lang),
                        })}
                      </Text>
                    </View>
                    {isBuying ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.packPrice}>{p.priceLabel}</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          <Text style={styles.footer}>{t("modals.creditsFooter")}</Text>

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeText}>{t("common.close")}</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#111111",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 36,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#3F3F46",
    alignSelf: "center",
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800",
  },
  introBadge: {
    backgroundColor: "#16a34a",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  introBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  subtitle: {
    color: "#9CA3AF",
    fontSize: 13,
    marginTop: 6,
    marginBottom: 12,
    lineHeight: 19,
  },
  loadingBlock: {
    paddingVertical: 40,
    alignItems: "center",
  },
  errorText: {
    color: "#FCA5A5",
    fontSize: 13,
    paddingVertical: 24,
    textAlign: "center",
    lineHeight: 19,
  },
  pack: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1F1F1F",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 10,
  },
  packBusy: {
    backgroundColor: "#E64A19",
  },
  packLeft: {
    flex: 1,
  },
  packCredits: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  packDetail: {
    color: "#9CA3AF",
    fontSize: 12,
    marginTop: 2,
  },
  packPrice: {
    color: "#E64A19",
    fontSize: 16,
    fontWeight: "800",
  },
  footer: {
    color: "#6B7280",
    fontSize: 11,
    marginTop: 8,
    marginBottom: 12,
    textAlign: "center",
    lineHeight: 16,
  },
  closeBtn: {
    paddingVertical: 12,
    alignItems: "center",
  },
  closeText: {
    color: "#9CA3AF",
    fontSize: 14,
    fontWeight: "600",
  },
});
