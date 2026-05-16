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

import { useEffect, useState } from "react";
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

const CREDIT_AMOUNT_BY_PRODUCT: Record<string, number> = {
  "com.speeditrades.speedipro.credits_10": 10,
  "com.speeditrades.speedipro.credits_20": 20,
  "com.speeditrades.speedipro.credits_50": 50,
};

function creditCountFor(productId: string): number {
  return CREDIT_AMOUNT_BY_PRODUCT[productId] ?? 0;
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
  const [products, setProducts] = useState<CreditPack[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [buying, setBuying] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Initialise IAP connection on first open, tear down on close.
  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    (async () => {
      try {
        setLoadingProducts(true);
        setLoadError(null);
        await connectIap();
        const fetched = await fetchProducts();
        if (cancelled) return;
        // Sort by credit count ascending so the smallest pack renders first.
        fetched.sort((a, b) => creditCountFor(a.productId) - creditCountFor(b.productId));
        setProducts(fetched);
        if (fetched.length === 0) {
          setLoadError(
            "Credit packs aren't available right now. Try again in a moment, or top up on speedi.co.uk.",
          );
        }
      } catch (e) {
        if (cancelled) return;
        console.log("IAP product fetch failed:", e);
        setLoadError(
          "Couldn't load credit packs. Check your connection and try again.",
        );
      } finally {
        if (!cancelled) setLoadingProducts(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [visible]);

  useEffect(() => {
    if (!visible) {
      disconnectIap();
    }
  }, [visible]);

  const handleBuy = async (productId: string) => {
    if (buying) return;
    setBuying(productId);
    try {
      const { creditsAdded, newBalance } = await buyCredits(productId);
      onPurchased?.(newBalance);
      Alert.alert(
        "Credits added 🎉",
        `${creditsAdded} credit${creditsAdded === 1 ? "" : "s"} added to your account. You now have ${newBalance}.`,
        [{ text: "Done", onPress: onClose }],
      );
    } catch (e) {
      const message = e instanceof Error ? e.message : "Try again.";
      // Suppress the noisy "user cancelled" path — Apple uses code E_USER_CANCELLED
      // on react-native-iap. Cheap heuristic: ignore messages with "cancel".
      if (!/cancel/i.test(message)) {
        Alert.alert("Purchase failed", message);
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
          <Text style={styles.title}>Buy credits</Text>
          <Text style={styles.subtitle}>
            1 credit unlocks one customer contact when you respond to a job.
          </Text>

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
                      <Text style={styles.packCredits}>{credits} credits</Text>
                      <Text style={styles.packDetail}>
                        £{(p.priceValue / credits).toFixed(2)} per credit
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

          <Text style={styles.footer}>
            Same-priced packs are available on speedi.co.uk — saving on Apple&apos;s
            commission. Use whichever&apos;s easier.
          </Text>

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeText}>Close</Text>
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
  title: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800",
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
