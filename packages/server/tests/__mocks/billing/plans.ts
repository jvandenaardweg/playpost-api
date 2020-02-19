export const plansMock = [
  {
      "id": "plan_GjA6MM7vp1T0Tn",
      "object": "plan",
      "active": true,
      "aggregate_usage": "sum",
      "amount": null,
      "amount_decimal": null,
      "billing_scheme": "tiered",
      "created": 1581600651,
      "currency": "usd",
      "interval": "day",
      "interval_count": 1,
      "livemode": false,
      "metadata": {},
      "nickname": "Monthly plan (test)",
      "product": "prod_GjA0qRb0NtdZQH",
      "tiers": [
          {
              "flat_amount": 999,
              "flat_amount_decimal": "999",
              "unit_amount": null,
              "unit_amount_decimal": null,
              "up_to": 100000
          },
          {
              "flat_amount": null,
              "flat_amount_decimal": null,
              "unit_amount": null,
              "unit_amount_decimal": "0.02",
              "up_to": null
          }
      ],
      "tiers_mode": "graduated",
      "transform_usage": null,
      "trial_period_days": 1,
      "usage_type": "metered"
  }
]
