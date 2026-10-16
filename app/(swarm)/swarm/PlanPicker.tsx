"use client";

import { useState } from "react";
import { SWARM_PLANS, type SwarmPlanKey } from "@/lib/swarm";
import styles from "./swarm.module.css";

// The visitor picks a plan; the checkout below is for that plan.
// Whop checkout: once the plan IDs are set (NEXT_PUBLIC_WHOP_PLAN_*), mount Whop
// Elements in CheckoutSlot. Whop mints a session per mount, so a plan change means
// a fresh mount (key the checkout on the plan ID), never an update of the old one.
export default function PlanPicker() {
  const [selected, setSelected] = useState<SwarmPlanKey>("founding");
  const plan = SWARM_PLANS.find((p) => p.key === selected) ?? SWARM_PLANS[0];

  return (
    <div className={styles.checkout}>
      <fieldset className={styles.plans}>
        <legend className={styles.srOnly}>Choose a plan</legend>
        {SWARM_PLANS.map((p) => (
          <label
            key={p.key}
            className={`${styles.plan} ${p.key === selected ? styles.planSelected : ""}`}
          >
            <input
              type="radio"
              name="swarm-plan"
              id={`swarm-plan-${p.key}`}
              value={p.key}
              checked={p.key === selected}
              onChange={() => setSelected(p.key)}
            />
            <span className={styles.planName}>{p.name}</span>
            <span className={styles.planPrice}>
              {p.price}
              <span>{p.period}</span>
            </span>
            <span className={styles.planNote}>{p.note}</span>
          </label>
        ))}
      </fieldset>
      <CheckoutSlot planId={plan.whopPlanId} planName={plan.name} key={plan.key} />
    </div>
  );
}

// Placeholder until the Whop Elements embed is wired in. It renders the same whether
// or not a plan ID is configured, so setting the env vars early never blanks the slot.
function CheckoutSlot({ planId, planName }: { planId: string | undefined; planName: string }) {
  return (
    <div className={styles.checkoutSlot} role="status" data-whop-plan={planId}>
      <p className={styles.label}>Checkout · {planName}</p>
      <p className={styles.checkoutSoon}>Checkout opens here soon.</p>
      <p className={styles.small}>Payment runs through Whop, by card or bank transfer (ACH).</p>
    </div>
  );
}
