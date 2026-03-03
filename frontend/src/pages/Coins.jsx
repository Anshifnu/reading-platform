import React, { useState } from "react";
import api from "../services/Api"; // adjust path if needed

const plans = [
  { label: "100 Coins", plan: "100_COINS", price: 9 },
  { label: "500 Coins", plan: "500_COINS", price: 39 },
  { label: "2000 Coins", plan: "2000_COINS", price: 99 },
];

const Coin = () => {
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  const buyCoins = async (plan) => {
    try {
      setLoading(true);
      setSelectedPlan(plan);

      const { data } = await api.post("/wallet/add-coins/", { plan });

      const options = {
        key: data.razorpay_key,
        amount: data.amount,
        currency: data.currency,
        order_id: data.order_id,
        name: "BookSphere",
        description: "Buy Coins",
        handler: async function (response) {
          try {
            const verifyRes = await api.post("/wallet/verify-coins/", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              coins: data.coins,
            });

            alert(
              `Success 🎉\nNew Balance: ${verifyRes.data.balance} coins`
            );
          } catch (err) {
            console.error(err);
            alert(
              err.response?.data?.error ||
                "Payment verification failed"
            );
          }
        },
        theme: { color: "#6366f1" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error(err);
      alert(
        err.response?.data?.error ||
          "Failed to create order"
      );
    } finally {
      setLoading(false);
      setSelectedPlan(null);
    }
  };

  const getCoinIcon = (label) => {
    if (label.includes("100")) return "🪙";
    if (label.includes("500")) return "💰";
    if (label.includes("2000")) return "💎";
    return "🪙";
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Buy Coins</h1>
        <p style={styles.subtitle}>Purchase coins to unlock premium features</p>
      </div>

      <div style={styles.plansGrid}>
        {plans.map((p) => (
          <div
            key={p.plan}
            style={{
              ...styles.card,
              ...(loading && selectedPlan === p.plan ? styles.cardLoading : {}),
            }}
          >
            <div style={styles.cardHeader}>
              <span style={styles.coinIcon}>{getCoinIcon(p.label)}</span>
              <div style={styles.badge}>BEST VALUE</div>
            </div>
            
            <h3 style={styles.planLabel}>{p.label}</h3>
            
            <div style={styles.priceContainer}>
              <span style={styles.currency}>₹</span>
              <span style={styles.price}>{p.price}</span>
            </div>

            <div style={styles.features}>
              <div style={styles.feature}>
                <span style={styles.checkIcon}>✓</span>
                <span>Instant delivery</span>
              </div>
              <div style={styles.feature}>
                <span style={styles.checkIcon}>✓</span>
                <span>No expiry</span>
              </div>
            </div>

            <button
              onClick={() => buyCoins(p.plan)}
              disabled={loading}
              style={{
                ...styles.button,
                ...(loading && selectedPlan === p.plan
                  ? styles.buttonLoading
                  : {}),
                ...(!loading && styles.buttonHover),
              }}
            >
              {loading && selectedPlan === p.plan ? (
                <span style={styles.buttonContent}>
                  <span style={styles.spinner}></span>
                  Processing...
                </span>
              ) : (
                "Buy Now"
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "40px 20px",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif',
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    textAlign: "center",
    marginBottom: "48px",
  },
  title: {
    fontSize: "48px",
    fontWeight: "800",
    marginBottom: "12px",
    background: "linear-gradient(to right, #fff, #e0e7ff)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    letterSpacing: "-0.5px",
  },
  subtitle: {
    fontSize: "18px",
    color: "rgba(255, 255, 255, 0.9)",
    marginTop: "8px",
  },
  plansGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "30px",
    width: "100%",
    maxWidth: "1000px",
  },
  card: {
    background: "white",
    borderRadius: "20px",
    padding: "32px 24px",
    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.15)",
    transition: "all 0.3s ease",
    position: "relative",
    display: "flex",
    flexDirection: "column",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    backdropFilter: "blur(10px)",
  },
  cardLoading: {
    opacity: 0.8,
    transform: "scale(0.98)",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "16px",
  },
  coinIcon: {
    fontSize: "32px",
  },
  badge: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  planLabel: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: "8px",
  },
  priceContainer: {
    display: "flex",
    alignItems: "baseline",
    marginBottom: "24px",
  },
  currency: {
    fontSize: "20px",
    fontWeight: "600",
    color: "#6b7280",
    marginRight: "4px",
  },
  price: {
    fontSize: "48px",
    fontWeight: "800",
    color: "#1a1a1a",
    lineHeight: 1,
  },
  features: {
    marginBottom: "32px",
    flex: 1,
  },
  feature: {
    display: "flex",
    alignItems: "center",
    marginBottom: "12px",
    color: "#4b5563",
    fontSize: "16px",
  },
  checkIcon: {
    color: "#10b981",
    marginRight: "12px",
    fontSize: "18px",
    fontWeight: "bold",
  },
  button: {
    width: "100%",
    padding: "14px 24px",
    border: "none",
    borderRadius: "12px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
    position: "relative",
    overflow: "hidden",
  },
  buttonHover: {
    transform: "translateY(-2px)",
    boxShadow: "0 10px 20px rgba(102, 126, 234, 0.4)",
  },
  buttonLoading: {
    opacity: 0.8,
    cursor: "not-allowed",
  },
  buttonContent: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
  },
  spinner: {
    display: "inline-block",
    width: "20px",
    height: "20px",
    border: "3px solid rgba(255, 255, 255, 0.3)",
    borderRadius: "50%",
    borderTopColor: "#fff",
    animation: "spin 1s ease-in-out infinite",
  },
};

// Add keyframes for spinner animation
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);

export default Coin;