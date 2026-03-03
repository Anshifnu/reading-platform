import { useEffect, useState } from "react";
import api from "../services/Api";

const Subscription = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [activePlan, setActivePlan] = useState(null);

  // 1️⃣ Fetch subscription plans AND user status
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [plansRes, statusRes] = await Promise.all([
          api.get("/subscriptions/plans/"),
          api.get("/subscriptions/status/"), // Fetch status
        ]);

        setPlans(plansRes.data);
        setActivePlan(statusRes.data.active_plan);
      } catch (err) {
        console.error("Failed to fetch data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 2️⃣ Create order + open Razorpay
  const subscribe = async (planType) => {
    try {
      setPaying(true);

      // Create Razorpay order
      const res = await api.post("/subscriptions/create-order/", {
        plan_type: planType,
      });

      const { order_id, amount, key } = res.data;

      const options = {
        key: key,
        amount: amount * 100,
        currency: "INR",
        name: "BookSphere",
        description: `${planType} subscription`,
        order_id: order_id,

        handler: async function (response) {
          // 3️⃣ Verify payment
          await api.post("/subscriptions/verify/", {
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            plan_type: planType,
          });

          alert("🎉 Subscription activated successfully!");
          window.location.reload(); // Reload to update status
        },

        theme: {
          color: "#2563eb",
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error("Subscription failed", error);
      alert("Payment failed. Please try again.");
    } finally {
      setPaying(false);
    }
  };

  // 🔄 Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500 font-semibold">
        Loading subscription plans...
      </div>
    );
  }

  // ⛔ Logic: If Active Yearly -> Show Message
  if (activePlan?.plan_type === "yearly") {
    return (
      <div className="min-h-screen bg-slate-50 px-6 py-14 flex items-center justify-center">
        <div className="text-center bg-white p-10 rounded-2xl shadow-sm border border-slate-200">
          <div className="text-6xl mb-4">👑</div>
          <h1 className="text-3xl font-black text-slate-900 mb-2">
            You have the Ultimate Plan!
          </h1>
          <p className="text-slate-500 mb-6">
            You are subscribed to the <strong>{activePlan.name}</strong>. Enjoy unlimited access until {new Date(activePlan.end_date).toLocaleDateString()}.
          </p>
          <button
            className="px-6 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition"
            onClick={() => window.history.back()}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-14">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-black text-slate-900 mb-12 text-center">
          Choose Your Subscription
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {plans
            // ⛔ Logic: If Active Monthly -> Hide Monthly (Show only Yearly)
            .filter((plan) => {
              if (activePlan?.plan_type === "monthly" && plan.plan_type === "monthly") {
                return false;
              }
              return true;
            })
            .map((plan) => (
              <div
                key={plan.id}
                className={`bg-white rounded-2xl shadow-sm border p-8 flex flex-col justify-between
                ${plan.plan_type === "yearly"
                    ? "border-green-500 scale-105"
                    : "border-slate-200"
                  }
              `}
              >
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    {plan.name}
                  </h2>

                  <p className="text-4xl font-black text-blue-600 mt-4">
                    ₹{plan.price}
                  </p>

                  <p className="text-slate-500 mt-2">
                    {plan.plan_type === "monthly"
                      ? "Billed monthly"
                      : "Billed yearly (Best value)"}
                  </p>

                  <ul className="mt-6 space-y-2 text-slate-600">
                    <li>✔ Unlimited reading</li>
                    <li>✔ Audio summaries</li>
                    <li>✔ Premium content</li>
                    <li>✔ Valid for {plan.duration_days} days</li>
                  </ul>
                </div>

                <button
                  disabled={paying}
                  onClick={() => subscribe(plan.plan_type)}
                  className={`mt-8 w-full py-4 rounded-xl font-bold transition-all
                  ${plan.plan_type === "yearly"
                      ? "bg-green-600 hover:bg-green-700 text-white"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                    }
                `}
                >
                  {paying ? "Processing..." : "Subscribe Now"}
                </button>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};
export default Subscription;
