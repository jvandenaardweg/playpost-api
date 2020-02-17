export const subscriptionsMock = [
  {
      "id": "sub_GjAafbGOy50oNW",
      "object": "subscription",
      "application_fee_percent": null,
      "billing_cycle_anchor": 1581602444,
      "billing_thresholds": null,
      "cancel_at": null,
      "cancel_at_period_end": false,
      "canceled_at": null,
      "collection_method": "charge_automatically",
      "created": 1581602444,
      "current_period_end": 1581948044,
      "current_period_start": 1581861644,
      "customer": {
          "id": "cus_GLBNvU7Y4CEL02",
          "object": "customer",
          "address": {
              "city": "Amsterdam",
              "country": "NL",
              "line1": "Orteliusstraat 217-2",
              "line2": "",
              "postal_code": "1056NR",
              "state": "Noord Holland"
          },
          "balance": 0,
          "created": 1576070022,
          "currency": "usd",
          "default_source": null,
          "delinquent": false,
          "description": "Demo account Playpost",
          "discount": null,
          "email": "info@playpost.app",
          "invoice_prefix": "BAA92057",
          "invoice_settings": {
              "custom_fields": null,
              "default_payment_method": "pm_1GCRSVLbygOvfi9ojuY8DFOq",
              "footer": null
          },
          "livemode": false,
          "metadata": {
              "customerId": "494081aa-a8ab-47f7-8316-3b2badd2dac4",
              "organizationId": "97629636-b7ff-4766-8f9f-0742465682ba",
              "adminEmail": "jordyvandenaardweg@gmail.com"
          },
          "name": "Playpost Demo",
          "phone": "+31612706744",
          "preferred_locales": [
              "en"
          ],
          "shipping": null,
          "sources": {
              "object": "list",
              "data": [],
              "has_more": false,
              "total_count": 0,
              "url": "/v1/customers/cus_GLBNvU7Y4CEL02/sources"
          },
          "subscriptions": {
              "object": "list",
              "data": [
                  {
                      "id": "sub_GjAafbGOy50oNW",
                      "object": "subscription",
                      "application_fee_percent": null,
                      "billing_cycle_anchor": 1581602444,
                      "billing_thresholds": null,
                      "cancel_at": null,
                      "cancel_at_period_end": false,
                      "canceled_at": null,
                      "collection_method": "charge_automatically",
                      "created": 1581602444,
                      "current_period_end": 1581948044,
                      "current_period_start": 1581861644,
                      "customer": "cus_GLBNvU7Y4CEL02",
                      "days_until_due": null,
                      "default_payment_method": null,
                      "default_source": null,
                      "default_tax_rates": [
                          {
                              "id": "txr_1Fqzv1LbygOvfi9oYJqZckKS",
                              "object": "tax_rate",
                              "active": true,
                              "created": 1576665495,
                              "description": "BTW",
                              "display_name": "VAT",
                              "inclusive": false,
                              "jurisdiction": "NL",
                              "livemode": false,
                              "metadata": {},
                              "percentage": 21
                          }
                      ],
                      "discount": null,
                      "ended_at": null,
                      "items": {
                          "object": "list",
                          "data": [
                              {
                                  "id": "si_GjAaZXZqKBEJA8",
                                  "object": "subscription_item",
                                  "billing_thresholds": null,
                                  "created": 1581602444,
                                  "metadata": {},
                                  "plan": {
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
                                  },
                                  "subscription": "sub_GjAafbGOy50oNW",
                                  "tax_rates": []
                              }
                          ],
                          "has_more": false,
                          "total_count": 1,
                          "url": "/v1/subscription_items?subscription=sub_GjAafbGOy50oNW"
                      },
                      "latest_invoice": "in_1GCng0LbygOvfi9ocJ77YtCb",
                      "livemode": false,
                      "metadata": {},
                      "next_pending_invoice_item_invoice": null,
                      "pending_invoice_item_interval": null,
                      "pending_setup_intent": null,
                      "pending_update": null,
                      "plan": {
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
                      },
                      "quantity": 1,
                      "schedule": null,
                      "start_date": 1581602444,
                      "status": "active",
                      "tax_percent": 21,
                      "trial_end": null,
                      "trial_start": null
                  }
              ],
              "has_more": false,
              "total_count": 1,
              "url": "/v1/customers/cus_GLBNvU7Y4CEL02/subscriptions"
          },
          "tax_exempt": "none",
          "tax_ids": {
              "object": "list",
              "data": [
                  {
                      "id": "txi_1GCW7oLbygOvfi9oJXiEx2mv",
                      "object": "tax_id",
                      "country": "NL",
                      "created": 1581794184,
                      "customer": "cus_GLBNvU7Y4CEL02",
                      "livemode": false,
                      "type": "eu_vat",
                      "value": "NL002175463B65",
                      "verification": {
                          "status": "verified",
                          "verified_address": "123 TEST STREET",
                          "verified_name": "TEST"
                      }
                  }
              ],
              "has_more": false,
              "total_count": 1,
              "url": "/v1/customers/cus_GLBNvU7Y4CEL02/tax_ids"
          }
      },
      "days_until_due": null,
      "default_payment_method": null,
      "default_source": null,
      "default_tax_rates": [
          {
              "id": "txr_1Fqzv1LbygOvfi9oYJqZckKS",
              "object": "tax_rate",
              "active": true,
              "created": 1576665495,
              "description": "BTW",
              "display_name": "VAT",
              "inclusive": false,
              "jurisdiction": "NL",
              "livemode": false,
              "metadata": {},
              "percentage": 21
          }
      ],
      "discount": null,
      "ended_at": null,
      "items": {
          "object": "list",
          "data": [
              {
                  "id": "si_GjAaZXZqKBEJA8",
                  "object": "subscription_item",
                  "billing_thresholds": null,
                  "created": 1581602444,
                  "metadata": {},
                  "plan": {
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
                  },
                  "subscription": "sub_GjAafbGOy50oNW",
                  "tax_rates": []
              }
          ],
          "has_more": false,
          "total_count": 1,
          "url": "/v1/subscription_items?subscription=sub_GjAafbGOy50oNW"
      },
      "latest_invoice": {
          "id": "in_1GCng0LbygOvfi9ocJ77YtCb",
          "object": "invoice",
          "account_country": "NL",
          "account_name": "Playpost",
          "amount_due": 1209,
          "amount_paid": 1209,
          "amount_remaining": 0,
          "application_fee_amount": null,
          "attempt_count": 1,
          "attempted": true,
          "auto_advance": false,
          "billing_reason": "subscription_cycle",
          "charge": "ch_1GCokHLbygOvfi9owO0zE2bX",
          "collection_method": "charge_automatically",
          "created": 1581861652,
          "currency": "usd",
          "custom_fields": null,
          "customer": "cus_GLBNvU7Y4CEL02",
          "customer_address": {
              "city": "Amsterdam",
              "country": "NL",
              "line1": "Orteliusstraat 217-2",
              "line2": "",
              "postal_code": "1056NR",
              "state": "Noord Holland"
          },
          "customer_email": "info@playpost.app",
          "customer_name": "Playpost Demo",
          "customer_phone": "+31612706744",
          "customer_shipping": null,
          "customer_tax_exempt": "none",
          "customer_tax_ids": [
              {
                  "type": "eu_vat",
                  "value": "NL002175463B65"
              }
          ],
          "default_payment_method": null,
          "default_source": null,
          "default_tax_rates": [
              {
                  "id": "txr_1Fqzv1LbygOvfi9oYJqZckKS",
                  "object": "tax_rate",
                  "active": true,
                  "created": 1576665495,
                  "description": "BTW",
                  "display_name": "VAT",
                  "inclusive": false,
                  "jurisdiction": "NL",
                  "livemode": false,
                  "metadata": {},
                  "percentage": 21
              }
          ],
          "description": null,
          "discount": null,
          "due_date": null,
          "ending_balance": 0,
          "footer": null,
          "hosted_invoice_url": "https://pay.stripe.com/invoice/invst_yENsYihSxkX4PfUdeW24IWAwGm",
          "invoice_pdf": "https://pay.stripe.com/invoice/invst_yENsYihSxkX4PfUdeW24IWAwGm/pdf",
          "lines": {
              "object": "list",
              "data": [
                  {
                      "id": "il_1GCng0LbygOvfi9oxOpP2JA6",
                      "object": "line_item",
                      "amount": 0,
                      "currency": "usd",
                      "description": "0 character × Basic (Tier 1 at $0.00 / day)",
                      "discountable": true,
                      "livemode": false,
                      "metadata": {},
                      "period": {
                          "end": 1581861352,
                          "start": 1581774966
                      },
                      "plan": {
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
                      },
                      "proration": false,
                      "quantity": 0,
                      "subscription": "sub_GjAafbGOy50oNW",
                      "subscription_item": "si_GjAaZXZqKBEJA8",
                      "tax_amounts": [
                          {
                              "amount": 0,
                              "inclusive": false,
                              "tax_rate": "txr_1Fqzv1LbygOvfi9oYJqZckKS"
                          }
                      ],
                      "tax_rates": [],
                      "type": "subscription"
                  },
                  {
                      "id": "il_1GCng1LbygOvfi9o2nGukHfy",
                      "object": "line_item",
                      "amount": 999,
                      "currency": "usd",
                      "description": "Basic (Tier 1 at $9.99 / day)",
                      "discountable": true,
                      "livemode": false,
                      "metadata": {},
                      "period": {
                          "end": 1581861352,
                          "start": 1581774966
                      },
                      "plan": {
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
                      },
                      "proration": false,
                      "quantity": 0,
                      "subscription": "sub_GjAafbGOy50oNW",
                      "subscription_item": "si_GjAaZXZqKBEJA8",
                      "tax_amounts": [
                          {
                              "amount": 210,
                              "inclusive": false,
                              "tax_rate": "txr_1Fqzv1LbygOvfi9oYJqZckKS"
                          }
                      ],
                      "tax_rates": [],
                      "type": "subscription"
                  }
              ],
              "has_more": false,
              "total_count": 2,
              "url": "/v1/invoices/in_1GCng0LbygOvfi9ocJ77YtCb/lines"
          },
          "livemode": false,
          "metadata": {},
          "next_payment_attempt": null,
          "number": "BAA92057-0020",
          "paid": true,
          "payment_intent": "pi_1GCokGLbygOvfi9oVlIm3HSW",
          "period_end": 1581861644,
          "period_start": 1581775244,
          "post_payment_credit_notes_amount": 0,
          "pre_payment_credit_notes_amount": 0,
          "receipt_number": null,
          "starting_balance": 0,
          "statement_descriptor": null,
          "status": "paid",
          "status_transitions": {
              "finalized_at": 1581865760,
              "marked_uncollectible_at": null,
              "paid_at": 1581865762,
              "voided_at": null
          },
          "subscription": "sub_GjAafbGOy50oNW",
          "subtotal": 999,
          "tax": 210,
          "tax_percent": 21,
          "total": 1209,
          "total_tax_amounts": [
              {
                  "amount": 210,
                  "inclusive": false,
                  "tax_rate": "txr_1Fqzv1LbygOvfi9oYJqZckKS"
              }
          ],
          "webhooks_delivered_at": 1581861655
      },
      "livemode": false,
      "metadata": {},
      "next_pending_invoice_item_invoice": null,
      "pending_invoice_item_interval": null,
      "pending_setup_intent": null,
      "pending_update": null,
      "plan": {
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
          "product": {
              "id": "prod_GjA0qRb0NtdZQH",
              "object": "product",
              "active": true,
              "attributes": [],
              "caption": null,
              "created": 1581600298,
              "deactivate_on": [],
              "description": null,
              "images": [],
              "livemode": false,
              "metadata": {
                  "feature1": "Player analytics",
                  "feature2": "Global fast world-wide audio hosting",
                  "feature3": "Easy to use Text to Speech editor",
                  "feature4": "1 publication"
              },
              "name": "Basic",
              "package_dimensions": null,
              "shippable": null,
              "statement_descriptor": "PLAYPOST-BASIC",
              "type": "service",
              "unit_label": "character",
              "updated": 1581679599,
              "url": null
          },
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
      },
      "quantity": 1,
      "schedule": null,
      "start_date": 1581602444,
      "status": "active",
      "tax_percent": 21,
      "trial_end": null,
      "trial_start": null
  },
  {
      "id": "sub_GgvH8wajaqErZZ",
      "object": "subscription",
      "application_fee_percent": null,
      "billing_cycle_anchor": 1581689201,
      "billing_thresholds": null,
      "cancel_at": null,
      "cancel_at_period_end": false,
      "canceled_at": 1581600739,
      "collection_method": "charge_automatically",
      "created": 1581084245,
      "current_period_end": 1581689201,
      "current_period_start": 1581084401,
      "customer": {
          "id": "cus_GLBNvU7Y4CEL02",
          "object": "customer",
          "address": {
              "city": "Amsterdam",
              "country": "NL",
              "line1": "Orteliusstraat 217-2",
              "line2": "",
              "postal_code": "1056NR",
              "state": "Noord Holland"
          },
          "balance": 0,
          "created": 1576070022,
          "currency": "usd",
          "default_source": null,
          "delinquent": false,
          "description": "Demo account Playpost",
          "discount": null,
          "email": "info@playpost.app",
          "invoice_prefix": "BAA92057",
          "invoice_settings": {
              "custom_fields": null,
              "default_payment_method": "pm_1GCRSVLbygOvfi9ojuY8DFOq",
              "footer": null
          },
          "livemode": false,
          "metadata": {
              "customerId": "494081aa-a8ab-47f7-8316-3b2badd2dac4",
              "organizationId": "97629636-b7ff-4766-8f9f-0742465682ba",
              "adminEmail": "jordyvandenaardweg@gmail.com"
          },
          "name": "Playpost Demo",
          "phone": "+31612706744",
          "preferred_locales": [
              "en"
          ],
          "shipping": null,
          "sources": {
              "object": "list",
              "data": [],
              "has_more": false,
              "total_count": 0,
              "url": "/v1/customers/cus_GLBNvU7Y4CEL02/sources"
          },
          "subscriptions": {
              "object": "list",
              "data": [
                  {
                      "id": "sub_GjAafbGOy50oNW",
                      "object": "subscription",
                      "application_fee_percent": null,
                      "billing_cycle_anchor": 1581602444,
                      "billing_thresholds": null,
                      "cancel_at": null,
                      "cancel_at_period_end": false,
                      "canceled_at": null,
                      "collection_method": "charge_automatically",
                      "created": 1581602444,
                      "current_period_end": 1581948044,
                      "current_period_start": 1581861644,
                      "customer": "cus_GLBNvU7Y4CEL02",
                      "days_until_due": null,
                      "default_payment_method": null,
                      "default_source": null,
                      "default_tax_rates": [
                          {
                              "id": "txr_1Fqzv1LbygOvfi9oYJqZckKS",
                              "object": "tax_rate",
                              "active": true,
                              "created": 1576665495,
                              "description": "BTW",
                              "display_name": "VAT",
                              "inclusive": false,
                              "jurisdiction": "NL",
                              "livemode": false,
                              "metadata": {},
                              "percentage": 21
                          }
                      ],
                      "discount": null,
                      "ended_at": null,
                      "items": {
                          "object": "list",
                          "data": [
                              {
                                  "id": "si_GjAaZXZqKBEJA8",
                                  "object": "subscription_item",
                                  "billing_thresholds": null,
                                  "created": 1581602444,
                                  "metadata": {},
                                  "plan": {
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
                                  },
                                  "subscription": "sub_GjAafbGOy50oNW",
                                  "tax_rates": []
                              }
                          ],
                          "has_more": false,
                          "total_count": 1,
                          "url": "/v1/subscription_items?subscription=sub_GjAafbGOy50oNW"
                      },
                      "latest_invoice": "in_1GCng0LbygOvfi9ocJ77YtCb",
                      "livemode": false,
                      "metadata": {},
                      "next_pending_invoice_item_invoice": null,
                      "pending_invoice_item_interval": null,
                      "pending_setup_intent": null,
                      "pending_update": null,
                      "plan": {
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
                      },
                      "quantity": 1,
                      "schedule": null,
                      "start_date": 1581602444,
                      "status": "active",
                      "tax_percent": 21,
                      "trial_end": null,
                      "trial_start": null
                  }
              ],
              "has_more": false,
              "total_count": 1,
              "url": "/v1/customers/cus_GLBNvU7Y4CEL02/subscriptions"
          },
          "tax_exempt": "none",
          "tax_ids": {
              "object": "list",
              "data": [
                  {
                      "id": "txi_1GCW7oLbygOvfi9oJXiEx2mv",
                      "object": "tax_id",
                      "country": "NL",
                      "created": 1581794184,
                      "customer": "cus_GLBNvU7Y4CEL02",
                      "livemode": false,
                      "type": "eu_vat",
                      "value": "NL002175463B65",
                      "verification": {
                          "status": "verified",
                          "verified_address": "123 TEST STREET",
                          "verified_name": "TEST"
                      }
                  }
              ],
              "has_more": false,
              "total_count": 1,
              "url": "/v1/customers/cus_GLBNvU7Y4CEL02/tax_ids"
          }
      },
      "days_until_due": null,
      "default_payment_method": null,
      "default_source": null,
      "default_tax_rates": [],
      "discount": null,
      "ended_at": 1581600739,
      "items": {
          "object": "list",
          "data": [
              {
                  "id": "si_GgvKc5I3DnjwR0",
                  "object": "subscription_item",
                  "billing_thresholds": null,
                  "created": 1581084402,
                  "metadata": {},
                  "plan": {
                      "id": "plan_GLVHSLbMkT1UX8",
                      "object": "plan",
                      "active": false,
                      "aggregate_usage": "sum",
                      "amount": null,
                      "amount_decimal": null,
                      "billing_scheme": "tiered",
                      "created": 1576144092,
                      "currency": "usd",
                      "interval": "month",
                      "interval_count": 1,
                      "livemode": false,
                      "metadata": {},
                      "nickname": "Monthly plan",
                      "product": "prod_GLVB5oHF6RfalZ",
                      "tiers": [
                          {
                              "flat_amount": 999,
                              "flat_amount_decimal": "999",
                              "unit_amount": 0,
                              "unit_amount_decimal": "0",
                              "up_to": 100000
                          },
                          {
                              "flat_amount": null,
                              "flat_amount_decimal": null,
                              "unit_amount": null,
                              "unit_amount_decimal": "0.016",
                              "up_to": null
                          }
                      ],
                      "tiers_mode": "graduated",
                      "transform_usage": null,
                      "trial_period_days": 1,
                      "usage_type": "metered"
                  },
                  "subscription": "sub_GgvH8wajaqErZZ",
                  "tax_rates": []
              }
          ],
          "has_more": false,
          "total_count": 1,
          "url": "/v1/subscription_items?subscription=sub_GgvH8wajaqErZZ"
      },
      "latest_invoice": {
          "id": "in_1G9XThLbygOvfi9owgIohJZf",
          "object": "invoice",
          "account_country": "NL",
          "account_name": "Playpost",
          "amount_due": 0,
          "amount_paid": 0,
          "amount_remaining": 0,
          "application_fee_amount": null,
          "attempt_count": 0,
          "attempted": true,
          "auto_advance": false,
          "billing_reason": "subscription_update",
          "charge": null,
          "collection_method": "charge_automatically",
          "created": 1581084401,
          "currency": "usd",
          "custom_fields": null,
          "customer": "cus_GLBNvU7Y4CEL02",
          "customer_address": {
              "city": "Amsterdam",
              "country": "Netherlands",
              "line1": "Orteliusstraat 217-2",
              "line2": "",
              "postal_code": "1056NR",
              "state": "Noord-Holland"
          },
          "customer_email": "info@playpost.app",
          "customer_name": "Playpost Demo",
          "customer_phone": "+31612706744",
          "customer_shipping": {
              "address": {
                  "city": "Amsterdam",
                  "country": "NL",
                  "line1": "Orteliusstraat 217-2",
                  "line2": "",
                  "postal_code": "1056NR",
                  "state": ""
              },
              "name": "Playpost",
              "phone": "+31612706744"
          },
          "customer_tax_exempt": "none",
          "customer_tax_ids": [],
          "default_payment_method": null,
          "default_source": null,
          "default_tax_rates": [],
          "description": null,
          "discount": null,
          "due_date": null,
          "ending_balance": 0,
          "footer": null,
          "hosted_invoice_url": "https://pay.stripe.com/invoice/invst_ro7jNUl8wvVCpApQdBZOllgbNB",
          "invoice_pdf": "https://pay.stripe.com/invoice/invst_ro7jNUl8wvVCpApQdBZOllgbNB/pdf",
          "lines": {
              "object": "list",
              "data": [
                  {
                      "id": "il_1G9XThLbygOvfi9oiwW9DI4s",
                      "object": "line_item",
                      "amount": 0,
                      "currency": "usd",
                      "description": "0 character × Pay Per Use (at $0.0005 / month)",
                      "discountable": true,
                      "livemode": false,
                      "metadata": {},
                      "period": {
                          "end": 1581084101,
                          "start": 1581084245
                      },
                      "plan": {
                          "id": "plan_GNopHD0jFpD0zO",
                          "object": "plan",
                          "active": false,
                          "aggregate_usage": "sum",
                          "amount": null,
                          "amount_decimal": "0.05",
                          "billing_scheme": "per_unit",
                          "created": 1576678060,
                          "currency": "usd",
                          "interval": "month",
                          "interval_count": 1,
                          "livemode": false,
                          "metadata": {},
                          "nickname": "Monthly plan",
                          "product": "prod_GNoXV2xtX4zdOI",
                          "tiers": null,
                          "tiers_mode": null,
                          "transform_usage": null,
                          "trial_period_days": 7,
                          "usage_type": "metered"
                      },
                      "proration": false,
                      "quantity": 0,
                      "subscription": "sub_GgvH8wajaqErZZ",
                      "subscription_item": "si_GgvHfmWWnMuTKz",
                      "tax_amounts": [],
                      "tax_rates": [],
                      "type": "subscription"
                  }
              ],
              "has_more": false,
              "total_count": 1,
              "url": "/v1/invoices/in_1G9XThLbygOvfi9owgIohJZf/lines"
          },
          "livemode": false,
          "metadata": {},
          "next_payment_attempt": null,
          "number": "BAA92057-0016",
          "paid": true,
          "payment_intent": null,
          "period_end": 1581084401,
          "period_start": 1581084401,
          "post_payment_credit_notes_amount": 0,
          "pre_payment_credit_notes_amount": 0,
          "receipt_number": "2344-1949",
          "starting_balance": 0,
          "statement_descriptor": null,
          "status": "paid",
          "status_transitions": {
              "finalized_at": 1581084401,
              "marked_uncollectible_at": null,
              "paid_at": 1581084402,
              "voided_at": null
          },
          "subscription": "sub_GgvH8wajaqErZZ",
          "subtotal": 0,
          "tax": null,
          "tax_percent": null,
          "total": 0,
          "total_tax_amounts": [],
          "webhooks_delivered_at": 1581084407
      },
      "livemode": false,
      "metadata": {},
      "next_pending_invoice_item_invoice": null,
      "pending_invoice_item_interval": null,
      "pending_setup_intent": null,
      "pending_update": null,
      "plan": {
          "id": "plan_GLVHSLbMkT1UX8",
          "object": "plan",
          "active": false,
          "aggregate_usage": "sum",
          "amount": null,
          "amount_decimal": null,
          "billing_scheme": "tiered",
          "created": 1576144092,
          "currency": "usd",
          "interval": "month",
          "interval_count": 1,
          "livemode": false,
          "metadata": {},
          "nickname": "Monthly plan",
          "product": {
              "id": "prod_GLVB5oHF6RfalZ",
              "object": "product",
              "deleted": true
          },
          "tiers": [
              {
                  "flat_amount": 999,
                  "flat_amount_decimal": "999",
                  "unit_amount": 0,
                  "unit_amount_decimal": "0",
                  "up_to": 100000
              },
              {
                  "flat_amount": null,
                  "flat_amount_decimal": null,
                  "unit_amount": null,
                  "unit_amount_decimal": "0.016",
                  "up_to": null
              }
          ],
          "tiers_mode": "graduated",
          "transform_usage": null,
          "trial_period_days": 1,
          "usage_type": "metered"
      },
      "quantity": 1,
      "schedule": null,
      "start_date": 1581084245,
      "status": "canceled",
      "tax_percent": null,
      "trial_end": 1581689201,
      "trial_start": 1581084401
  },
  {
      "id": "sub_GguEJd0iWeIKXE",
      "object": "subscription",
      "application_fee_percent": null,
      "billing_cycle_anchor": 1581080359,
      "billing_thresholds": null,
      "cancel_at": null,
      "cancel_at_period_end": false,
      "canceled_at": 1581080392,
      "collection_method": "charge_automatically",
      "created": 1581080359,
      "current_period_end": 1583585959,
      "current_period_start": 1581080359,
      "customer": {
          "id": "cus_GLBNvU7Y4CEL02",
          "object": "customer",
          "address": {
              "city": "Amsterdam",
              "country": "NL",
              "line1": "Orteliusstraat 217-2",
              "line2": "",
              "postal_code": "1056NR",
              "state": "Noord Holland"
          },
          "balance": 0,
          "created": 1576070022,
          "currency": "usd",
          "default_source": null,
          "delinquent": false,
          "description": "Demo account Playpost",
          "discount": null,
          "email": "info@playpost.app",
          "invoice_prefix": "BAA92057",
          "invoice_settings": {
              "custom_fields": null,
              "default_payment_method": "pm_1GCRSVLbygOvfi9ojuY8DFOq",
              "footer": null
          },
          "livemode": false,
          "metadata": {
              "customerId": "494081aa-a8ab-47f7-8316-3b2badd2dac4",
              "organizationId": "97629636-b7ff-4766-8f9f-0742465682ba",
              "adminEmail": "jordyvandenaardweg@gmail.com"
          },
          "name": "Playpost Demo",
          "phone": "+31612706744",
          "preferred_locales": [
              "en"
          ],
          "shipping": null,
          "sources": {
              "object": "list",
              "data": [],
              "has_more": false,
              "total_count": 0,
              "url": "/v1/customers/cus_GLBNvU7Y4CEL02/sources"
          },
          "subscriptions": {
              "object": "list",
              "data": [
                  {
                      "id": "sub_GjAafbGOy50oNW",
                      "object": "subscription",
                      "application_fee_percent": null,
                      "billing_cycle_anchor": 1581602444,
                      "billing_thresholds": null,
                      "cancel_at": null,
                      "cancel_at_period_end": false,
                      "canceled_at": null,
                      "collection_method": "charge_automatically",
                      "created": 1581602444,
                      "current_period_end": 1581948044,
                      "current_period_start": 1581861644,
                      "customer": "cus_GLBNvU7Y4CEL02",
                      "days_until_due": null,
                      "default_payment_method": null,
                      "default_source": null,
                      "default_tax_rates": [
                          {
                              "id": "txr_1Fqzv1LbygOvfi9oYJqZckKS",
                              "object": "tax_rate",
                              "active": true,
                              "created": 1576665495,
                              "description": "BTW",
                              "display_name": "VAT",
                              "inclusive": false,
                              "jurisdiction": "NL",
                              "livemode": false,
                              "metadata": {},
                              "percentage": 21
                          }
                      ],
                      "discount": null,
                      "ended_at": null,
                      "items": {
                          "object": "list",
                          "data": [
                              {
                                  "id": "si_GjAaZXZqKBEJA8",
                                  "object": "subscription_item",
                                  "billing_thresholds": null,
                                  "created": 1581602444,
                                  "metadata": {},
                                  "plan": {
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
                                  },
                                  "subscription": "sub_GjAafbGOy50oNW",
                                  "tax_rates": []
                              }
                          ],
                          "has_more": false,
                          "total_count": 1,
                          "url": "/v1/subscription_items?subscription=sub_GjAafbGOy50oNW"
                      },
                      "latest_invoice": "in_1GCng0LbygOvfi9ocJ77YtCb",
                      "livemode": false,
                      "metadata": {},
                      "next_pending_invoice_item_invoice": null,
                      "pending_invoice_item_interval": null,
                      "pending_setup_intent": null,
                      "pending_update": null,
                      "plan": {
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
                      },
                      "quantity": 1,
                      "schedule": null,
                      "start_date": 1581602444,
                      "status": "active",
                      "tax_percent": 21,
                      "trial_end": null,
                      "trial_start": null
                  }
              ],
              "has_more": false,
              "total_count": 1,
              "url": "/v1/customers/cus_GLBNvU7Y4CEL02/subscriptions"
          },
          "tax_exempt": "none",
          "tax_ids": {
              "object": "list",
              "data": [
                  {
                      "id": "txi_1GCW7oLbygOvfi9oJXiEx2mv",
                      "object": "tax_id",
                      "country": "NL",
                      "created": 1581794184,
                      "customer": "cus_GLBNvU7Y4CEL02",
                      "livemode": false,
                      "type": "eu_vat",
                      "value": "NL002175463B65",
                      "verification": {
                          "status": "verified",
                          "verified_address": "123 TEST STREET",
                          "verified_name": "TEST"
                      }
                  }
              ],
              "has_more": false,
              "total_count": 1,
              "url": "/v1/customers/cus_GLBNvU7Y4CEL02/tax_ids"
          }
      },
      "days_until_due": null,
      "default_payment_method": null,
      "default_source": null,
      "default_tax_rates": [],
      "discount": null,
      "ended_at": 1581080392,
      "items": {
          "object": "list",
          "data": [
              {
                  "id": "si_GguEsTbsE1wtg6",
                  "object": "subscription_item",
                  "billing_thresholds": null,
                  "created": 1581080359,
                  "metadata": {},
                  "plan": {
                      "id": "plan_GNopHD0jFpD0zO",
                      "object": "plan",
                      "active": false,
                      "aggregate_usage": "sum",
                      "amount": null,
                      "amount_decimal": "0.05",
                      "billing_scheme": "per_unit",
                      "created": 1576678060,
                      "currency": "usd",
                      "interval": "month",
                      "interval_count": 1,
                      "livemode": false,
                      "metadata": {},
                      "nickname": "Monthly plan",
                      "product": "prod_GNoXV2xtX4zdOI",
                      "tiers": null,
                      "tiers_mode": null,
                      "transform_usage": null,
                      "trial_period_days": 7,
                      "usage_type": "metered"
                  },
                  "subscription": "sub_GguEJd0iWeIKXE",
                  "tax_rates": []
              }
          ],
          "has_more": false,
          "total_count": 1,
          "url": "/v1/subscription_items?subscription=sub_GguEJd0iWeIKXE"
      },
      "latest_invoice": {
          "id": "in_1G9WR2LbygOvfi9oNKXzHWo6",
          "object": "invoice",
          "account_country": "NL",
          "account_name": "Playpost",
          "amount_due": 0,
          "amount_paid": 0,
          "amount_remaining": 0,
          "application_fee_amount": null,
          "attempt_count": 0,
          "attempted": true,
          "auto_advance": false,
          "billing_reason": "subscription_cycle",
          "charge": null,
          "collection_method": "charge_automatically",
          "created": 1581080392,
          "currency": "usd",
          "custom_fields": null,
          "customer": "cus_GLBNvU7Y4CEL02",
          "customer_address": {
              "city": "Amsterdam",
              "country": "Netherlands",
              "line1": "Orteliusstraat 217-2",
              "line2": "",
              "postal_code": "1056NR",
              "state": "Noord-Holland"
          },
          "customer_email": "info@playpost.app",
          "customer_name": "Playpost Demo",
          "customer_phone": "+31612706744",
          "customer_shipping": {
              "address": {
                  "city": "Amsterdam",
                  "country": "NL",
                  "line1": "Orteliusstraat 217-2",
                  "line2": "",
                  "postal_code": "1056NR",
                  "state": ""
              },
              "name": "Playpost",
              "phone": "+31612706744"
          },
          "customer_tax_exempt": "none",
          "customer_tax_ids": [],
          "default_payment_method": null,
          "default_source": null,
          "default_tax_rates": [],
          "description": null,
          "discount": null,
          "due_date": null,
          "ending_balance": 0,
          "footer": null,
          "hosted_invoice_url": "https://pay.stripe.com/invoice/invst_Svep0bf2rWIvQGtgGCniqHFwV1",
          "invoice_pdf": "https://pay.stripe.com/invoice/invst_Svep0bf2rWIvQGtgGCniqHFwV1/pdf",
          "lines": {
              "object": "list",
              "data": [
                  {
                      "id": "il_1G9WR2LbygOvfi9olcbZiDuJ",
                      "object": "line_item",
                      "amount": 0,
                      "currency": "usd",
                      "description": "0 character × Pay Per Use (at $0.0005 / month)",
                      "discountable": true,
                      "livemode": false,
                      "metadata": {},
                      "period": {
                          "end": 1581080092,
                          "start": 1581080359
                      },
                      "plan": {
                          "id": "plan_GNopHD0jFpD0zO",
                          "object": "plan",
                          "active": false,
                          "aggregate_usage": "sum",
                          "amount": null,
                          "amount_decimal": "0.05",
                          "billing_scheme": "per_unit",
                          "created": 1576678060,
                          "currency": "usd",
                          "interval": "month",
                          "interval_count": 1,
                          "livemode": false,
                          "metadata": {},
                          "nickname": "Monthly plan",
                          "product": "prod_GNoXV2xtX4zdOI",
                          "tiers": null,
                          "tiers_mode": null,
                          "transform_usage": null,
                          "trial_period_days": 7,
                          "usage_type": "metered"
                      },
                      "proration": false,
                      "quantity": 0,
                      "subscription": "sub_GguEJd0iWeIKXE",
                      "subscription_item": "si_GguEsTbsE1wtg6",
                      "tax_amounts": [],
                      "tax_rates": [],
                      "type": "subscription"
                  }
              ],
              "has_more": false,
              "total_count": 1,
              "url": "/v1/invoices/in_1G9WR2LbygOvfi9oNKXzHWo6/lines"
          },
          "livemode": false,
          "metadata": {},
          "next_payment_attempt": null,
          "number": "BAA92057-0013",
          "paid": true,
          "payment_intent": null,
          "period_end": 1581080392,
          "period_start": 1581080359,
          "post_payment_credit_notes_amount": 0,
          "pre_payment_credit_notes_amount": 0,
          "receipt_number": null,
          "starting_balance": 0,
          "statement_descriptor": null,
          "status": "paid",
          "status_transitions": {
              "finalized_at": 1581084178,
              "marked_uncollectible_at": null,
              "paid_at": 1581084178,
              "voided_at": null
          },
          "subscription": "sub_GguEJd0iWeIKXE",
          "subtotal": 0,
          "tax": null,
          "tax_percent": null,
          "total": 0,
          "total_tax_amounts": [],
          "webhooks_delivered_at": 1581080393
      },
      "livemode": false,
      "metadata": {},
      "next_pending_invoice_item_invoice": null,
      "pending_invoice_item_interval": null,
      "pending_setup_intent": null,
      "pending_update": null,
      "plan": {
          "id": "plan_GNopHD0jFpD0zO",
          "object": "plan",
          "active": false,
          "aggregate_usage": "sum",
          "amount": null,
          "amount_decimal": "0.05",
          "billing_scheme": "per_unit",
          "created": 1576678060,
          "currency": "usd",
          "interval": "month",
          "interval_count": 1,
          "livemode": false,
          "metadata": {},
          "nickname": "Monthly plan",
          "product": {
              "id": "prod_GNoXV2xtX4zdOI",
              "object": "product",
              "deleted": true
          },
          "tiers": null,
          "tiers_mode": null,
          "transform_usage": null,
          "trial_period_days": 7,
          "usage_type": "metered"
      },
      "quantity": 1,
      "schedule": null,
      "start_date": 1581080359,
      "status": "canceled",
      "tax_percent": null,
      "trial_end": null,
      "trial_start": null
  },
  {
      "id": "sub_GguB2kgEfJiZDN",
      "object": "subscription",
      "application_fee_percent": null,
      "billing_cycle_anchor": 1581080162,
      "billing_thresholds": null,
      "cancel_at": null,
      "cancel_at_period_end": false,
      "canceled_at": 1581084358,
      "collection_method": "charge_automatically",
      "created": 1581080162,
      "current_period_end": 1583585762,
      "current_period_start": 1581080162,
      "customer": {
          "id": "cus_GLBNvU7Y4CEL02",
          "object": "customer",
          "address": {
              "city": "Amsterdam",
              "country": "NL",
              "line1": "Orteliusstraat 217-2",
              "line2": "",
              "postal_code": "1056NR",
              "state": "Noord Holland"
          },
          "balance": 0,
          "created": 1576070022,
          "currency": "usd",
          "default_source": null,
          "delinquent": false,
          "description": "Demo account Playpost",
          "discount": null,
          "email": "info@playpost.app",
          "invoice_prefix": "BAA92057",
          "invoice_settings": {
              "custom_fields": null,
              "default_payment_method": "pm_1GCRSVLbygOvfi9ojuY8DFOq",
              "footer": null
          },
          "livemode": false,
          "metadata": {
              "customerId": "494081aa-a8ab-47f7-8316-3b2badd2dac4",
              "organizationId": "97629636-b7ff-4766-8f9f-0742465682ba",
              "adminEmail": "jordyvandenaardweg@gmail.com"
          },
          "name": "Playpost Demo",
          "phone": "+31612706744",
          "preferred_locales": [
              "en"
          ],
          "shipping": null,
          "sources": {
              "object": "list",
              "data": [],
              "has_more": false,
              "total_count": 0,
              "url": "/v1/customers/cus_GLBNvU7Y4CEL02/sources"
          },
          "subscriptions": {
              "object": "list",
              "data": [
                  {
                      "id": "sub_GjAafbGOy50oNW",
                      "object": "subscription",
                      "application_fee_percent": null,
                      "billing_cycle_anchor": 1581602444,
                      "billing_thresholds": null,
                      "cancel_at": null,
                      "cancel_at_period_end": false,
                      "canceled_at": null,
                      "collection_method": "charge_automatically",
                      "created": 1581602444,
                      "current_period_end": 1581948044,
                      "current_period_start": 1581861644,
                      "customer": "cus_GLBNvU7Y4CEL02",
                      "days_until_due": null,
                      "default_payment_method": null,
                      "default_source": null,
                      "default_tax_rates": [
                          {
                              "id": "txr_1Fqzv1LbygOvfi9oYJqZckKS",
                              "object": "tax_rate",
                              "active": true,
                              "created": 1576665495,
                              "description": "BTW",
                              "display_name": "VAT",
                              "inclusive": false,
                              "jurisdiction": "NL",
                              "livemode": false,
                              "metadata": {},
                              "percentage": 21
                          }
                      ],
                      "discount": null,
                      "ended_at": null,
                      "items": {
                          "object": "list",
                          "data": [
                              {
                                  "id": "si_GjAaZXZqKBEJA8",
                                  "object": "subscription_item",
                                  "billing_thresholds": null,
                                  "created": 1581602444,
                                  "metadata": {},
                                  "plan": {
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
                                  },
                                  "subscription": "sub_GjAafbGOy50oNW",
                                  "tax_rates": []
                              }
                          ],
                          "has_more": false,
                          "total_count": 1,
                          "url": "/v1/subscription_items?subscription=sub_GjAafbGOy50oNW"
                      },
                      "latest_invoice": "in_1GCng0LbygOvfi9ocJ77YtCb",
                      "livemode": false,
                      "metadata": {},
                      "next_pending_invoice_item_invoice": null,
                      "pending_invoice_item_interval": null,
                      "pending_setup_intent": null,
                      "pending_update": null,
                      "plan": {
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
                      },
                      "quantity": 1,
                      "schedule": null,
                      "start_date": 1581602444,
                      "status": "active",
                      "tax_percent": 21,
                      "trial_end": null,
                      "trial_start": null
                  }
              ],
              "has_more": false,
              "total_count": 1,
              "url": "/v1/customers/cus_GLBNvU7Y4CEL02/subscriptions"
          },
          "tax_exempt": "none",
          "tax_ids": {
              "object": "list",
              "data": [
                  {
                      "id": "txi_1GCW7oLbygOvfi9oJXiEx2mv",
                      "object": "tax_id",
                      "country": "NL",
                      "created": 1581794184,
                      "customer": "cus_GLBNvU7Y4CEL02",
                      "livemode": false,
                      "type": "eu_vat",
                      "value": "NL002175463B65",
                      "verification": {
                          "status": "verified",
                          "verified_address": "123 TEST STREET",
                          "verified_name": "TEST"
                      }
                  }
              ],
              "has_more": false,
              "total_count": 1,
              "url": "/v1/customers/cus_GLBNvU7Y4CEL02/tax_ids"
          }
      },
      "days_until_due": null,
      "default_payment_method": null,
      "default_source": null,
      "default_tax_rates": [],
      "discount": null,
      "ended_at": 1581084358,
      "items": {
          "object": "list",
          "data": [
              {
                  "id": "si_GguBrSj5R58ONX",
                  "object": "subscription_item",
                  "billing_thresholds": null,
                  "created": 1581080162,
                  "metadata": {},
                  "plan": {
                      "id": "plan_GNopHD0jFpD0zO",
                      "object": "plan",
                      "active": false,
                      "aggregate_usage": "sum",
                      "amount": null,
                      "amount_decimal": "0.05",
                      "billing_scheme": "per_unit",
                      "created": 1576678060,
                      "currency": "usd",
                      "interval": "month",
                      "interval_count": 1,
                      "livemode": false,
                      "metadata": {},
                      "nickname": "Monthly plan",
                      "product": "prod_GNoXV2xtX4zdOI",
                      "tiers": null,
                      "tiers_mode": null,
                      "transform_usage": null,
                      "trial_period_days": 7,
                      "usage_type": "metered"
                  },
                  "subscription": "sub_GguB2kgEfJiZDN",
                  "tax_rates": []
              }
          ],
          "has_more": false,
          "total_count": 1,
          "url": "/v1/subscription_items?subscription=sub_GguB2kgEfJiZDN"
      },
      "latest_invoice": {
          "id": "in_1G9XT0LbygOvfi9oIKgKdjFs",
          "object": "invoice",
          "account_country": "NL",
          "account_name": "Playpost",
          "amount_due": 0,
          "amount_paid": 0,
          "amount_remaining": 0,
          "application_fee_amount": null,
          "attempt_count": 0,
          "attempted": true,
          "auto_advance": false,
          "billing_reason": "subscription_cycle",
          "charge": null,
          "collection_method": "charge_automatically",
          "created": 1581084358,
          "currency": "usd",
          "custom_fields": null,
          "customer": "cus_GLBNvU7Y4CEL02",
          "customer_address": {
              "city": "Amsterdam",
              "country": "Netherlands",
              "line1": "Orteliusstraat 217-2",
              "line2": "",
              "postal_code": "1056NR",
              "state": "Noord-Holland"
          },
          "customer_email": "info@playpost.app",
          "customer_name": "Playpost Demo",
          "customer_phone": "+31612706744",
          "customer_shipping": {
              "address": {
                  "city": "Amsterdam",
                  "country": "NL",
                  "line1": "Orteliusstraat 217-2",
                  "line2": "",
                  "postal_code": "1056NR",
                  "state": ""
              },
              "name": "Playpost",
              "phone": "+31612706744"
          },
          "customer_tax_exempt": "none",
          "customer_tax_ids": [],
          "default_payment_method": null,
          "default_source": null,
          "default_tax_rates": [],
          "description": null,
          "discount": null,
          "due_date": null,
          "ending_balance": 0,
          "footer": null,
          "hosted_invoice_url": "https://pay.stripe.com/invoice/invst_CNJ6K6QtB8PXCQuYlgC9mk36bp",
          "invoice_pdf": "https://pay.stripe.com/invoice/invst_CNJ6K6QtB8PXCQuYlgC9mk36bp/pdf",
          "lines": {
              "object": "list",
              "data": [
                  {
                      "id": "il_1G9XT0LbygOvfi9oN4Ow91IR",
                      "object": "line_item",
                      "amount": 0,
                      "currency": "usd",
                      "description": "0 character × Pay Per Use (at $0.0005 / month)",
                      "discountable": true,
                      "livemode": false,
                      "metadata": {},
                      "period": {
                          "end": 1581084058,
                          "start": 1581080162
                      },
                      "plan": {
                          "id": "plan_GNopHD0jFpD0zO",
                          "object": "plan",
                          "active": false,
                          "aggregate_usage": "sum",
                          "amount": null,
                          "amount_decimal": "0.05",
                          "billing_scheme": "per_unit",
                          "created": 1576678060,
                          "currency": "usd",
                          "interval": "month",
                          "interval_count": 1,
                          "livemode": false,
                          "metadata": {},
                          "nickname": "Monthly plan",
                          "product": "prod_GNoXV2xtX4zdOI",
                          "tiers": null,
                          "tiers_mode": null,
                          "transform_usage": null,
                          "trial_period_days": 7,
                          "usage_type": "metered"
                      },
                      "proration": false,
                      "quantity": 0,
                      "subscription": "sub_GguB2kgEfJiZDN",
                      "subscription_item": "si_GguBrSj5R58ONX",
                      "tax_amounts": [],
                      "tax_rates": [],
                      "type": "subscription"
                  }
              ],
              "has_more": false,
              "total_count": 1,
              "url": "/v1/invoices/in_1G9XT0LbygOvfi9oIKgKdjFs/lines"
          },
          "livemode": false,
          "metadata": {},
          "next_payment_attempt": null,
          "number": "BAA92057-0015",
          "paid": true,
          "payment_intent": null,
          "period_end": 1581084358,
          "period_start": 1581080162,
          "post_payment_credit_notes_amount": 0,
          "pre_payment_credit_notes_amount": 0,
          "receipt_number": null,
          "starting_balance": 0,
          "statement_descriptor": null,
          "status": "paid",
          "status_transitions": {
              "finalized_at": 1581088350,
              "marked_uncollectible_at": null,
              "paid_at": 1581088350,
              "voided_at": null
          },
          "subscription": "sub_GguB2kgEfJiZDN",
          "subtotal": 0,
          "tax": null,
          "tax_percent": null,
          "total": 0,
          "total_tax_amounts": [],
          "webhooks_delivered_at": 1581084361
      },
      "livemode": false,
      "metadata": {},
      "next_pending_invoice_item_invoice": null,
      "pending_invoice_item_interval": null,
      "pending_setup_intent": null,
      "pending_update": null,
      "plan": {
          "id": "plan_GNopHD0jFpD0zO",
          "object": "plan",
          "active": false,
          "aggregate_usage": "sum",
          "amount": null,
          "amount_decimal": "0.05",
          "billing_scheme": "per_unit",
          "created": 1576678060,
          "currency": "usd",
          "interval": "month",
          "interval_count": 1,
          "livemode": false,
          "metadata": {},
          "nickname": "Monthly plan",
          "product": {
              "id": "prod_GNoXV2xtX4zdOI",
              "object": "product",
              "deleted": true
          },
          "tiers": null,
          "tiers_mode": null,
          "transform_usage": null,
          "trial_period_days": 7,
          "usage_type": "metered"
      },
      "quantity": 1,
      "schedule": null,
      "start_date": 1581080162,
      "status": "canceled",
      "tax_percent": null,
      "trial_end": null,
      "trial_start": null
  },
  {
      "id": "sub_GdaDHFaxUwEY9w",
      "object": "subscription",
      "application_fee_percent": null,
      "billing_cycle_anchor": 1580918746,
      "billing_thresholds": null,
      "cancel_at": null,
      "cancel_at_period_end": false,
      "canceled_at": 1580314130,
      "collection_method": "send_invoice",
      "created": 1580313946,
      "current_period_end": 1580918746,
      "current_period_start": 1580313946,
      "customer": {
          "id": "cus_GLBNvU7Y4CEL02",
          "object": "customer",
          "address": {
              "city": "Amsterdam",
              "country": "NL",
              "line1": "Orteliusstraat 217-2",
              "line2": "",
              "postal_code": "1056NR",
              "state": "Noord Holland"
          },
          "balance": 0,
          "created": 1576070022,
          "currency": "usd",
          "default_source": null,
          "delinquent": false,
          "description": "Demo account Playpost",
          "discount": null,
          "email": "info@playpost.app",
          "invoice_prefix": "BAA92057",
          "invoice_settings": {
              "custom_fields": null,
              "default_payment_method": "pm_1GCRSVLbygOvfi9ojuY8DFOq",
              "footer": null
          },
          "livemode": false,
          "metadata": {
              "customerId": "494081aa-a8ab-47f7-8316-3b2badd2dac4",
              "organizationId": "97629636-b7ff-4766-8f9f-0742465682ba",
              "adminEmail": "jordyvandenaardweg@gmail.com"
          },
          "name": "Playpost Demo",
          "phone": "+31612706744",
          "preferred_locales": [
              "en"
          ],
          "shipping": null,
          "sources": {
              "object": "list",
              "data": [],
              "has_more": false,
              "total_count": 0,
              "url": "/v1/customers/cus_GLBNvU7Y4CEL02/sources"
          },
          "subscriptions": {
              "object": "list",
              "data": [
                  {
                      "id": "sub_GjAafbGOy50oNW",
                      "object": "subscription",
                      "application_fee_percent": null,
                      "billing_cycle_anchor": 1581602444,
                      "billing_thresholds": null,
                      "cancel_at": null,
                      "cancel_at_period_end": false,
                      "canceled_at": null,
                      "collection_method": "charge_automatically",
                      "created": 1581602444,
                      "current_period_end": 1581948044,
                      "current_period_start": 1581861644,
                      "customer": "cus_GLBNvU7Y4CEL02",
                      "days_until_due": null,
                      "default_payment_method": null,
                      "default_source": null,
                      "default_tax_rates": [
                          {
                              "id": "txr_1Fqzv1LbygOvfi9oYJqZckKS",
                              "object": "tax_rate",
                              "active": true,
                              "created": 1576665495,
                              "description": "BTW",
                              "display_name": "VAT",
                              "inclusive": false,
                              "jurisdiction": "NL",
                              "livemode": false,
                              "metadata": {},
                              "percentage": 21
                          }
                      ],
                      "discount": null,
                      "ended_at": null,
                      "items": {
                          "object": "list",
                          "data": [
                              {
                                  "id": "si_GjAaZXZqKBEJA8",
                                  "object": "subscription_item",
                                  "billing_thresholds": null,
                                  "created": 1581602444,
                                  "metadata": {},
                                  "plan": {
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
                                  },
                                  "subscription": "sub_GjAafbGOy50oNW",
                                  "tax_rates": []
                              }
                          ],
                          "has_more": false,
                          "total_count": 1,
                          "url": "/v1/subscription_items?subscription=sub_GjAafbGOy50oNW"
                      },
                      "latest_invoice": "in_1GCng0LbygOvfi9ocJ77YtCb",
                      "livemode": false,
                      "metadata": {},
                      "next_pending_invoice_item_invoice": null,
                      "pending_invoice_item_interval": null,
                      "pending_setup_intent": null,
                      "pending_update": null,
                      "plan": {
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
                      },
                      "quantity": 1,
                      "schedule": null,
                      "start_date": 1581602444,
                      "status": "active",
                      "tax_percent": 21,
                      "trial_end": null,
                      "trial_start": null
                  }
              ],
              "has_more": false,
              "total_count": 1,
              "url": "/v1/customers/cus_GLBNvU7Y4CEL02/subscriptions"
          },
          "tax_exempt": "none",
          "tax_ids": {
              "object": "list",
              "data": [
                  {
                      "id": "txi_1GCW7oLbygOvfi9oJXiEx2mv",
                      "object": "tax_id",
                      "country": "NL",
                      "created": 1581794184,
                      "customer": "cus_GLBNvU7Y4CEL02",
                      "livemode": false,
                      "type": "eu_vat",
                      "value": "NL002175463B65",
                      "verification": {
                          "status": "verified",
                          "verified_address": "123 TEST STREET",
                          "verified_name": "TEST"
                      }
                  }
              ],
              "has_more": false,
              "total_count": 1,
              "url": "/v1/customers/cus_GLBNvU7Y4CEL02/tax_ids"
          }
      },
      "days_until_due": 7,
      "default_payment_method": null,
      "default_source": null,
      "default_tax_rates": [],
      "discount": null,
      "ended_at": 1580314130,
      "items": {
          "object": "list",
          "data": [
              {
                  "id": "si_GdaDOoceL9NuW7",
                  "object": "subscription_item",
                  "billing_thresholds": null,
                  "created": 1580313947,
                  "metadata": {},
                  "plan": {
                      "id": "plan_GNopHD0jFpD0zO",
                      "object": "plan",
                      "active": false,
                      "aggregate_usage": "sum",
                      "amount": null,
                      "amount_decimal": "0.05",
                      "billing_scheme": "per_unit",
                      "created": 1576678060,
                      "currency": "usd",
                      "interval": "month",
                      "interval_count": 1,
                      "livemode": false,
                      "metadata": {},
                      "nickname": "Monthly plan",
                      "product": "prod_GNoXV2xtX4zdOI",
                      "tiers": null,
                      "tiers_mode": null,
                      "transform_usage": null,
                      "trial_period_days": 7,
                      "usage_type": "metered"
                  },
                  "subscription": "sub_GdaDHFaxUwEY9w",
                  "tax_rates": []
              }
          ],
          "has_more": false,
          "total_count": 1,
          "url": "/v1/subscription_items?subscription=sub_GdaDHFaxUwEY9w"
      },
      "latest_invoice": {
          "id": "in_1G6J30LbygOvfi9oa6tx9ERH",
          "object": "invoice",
          "account_country": "NL",
          "account_name": "Playpost",
          "amount_due": 0,
          "amount_paid": 0,
          "amount_remaining": 0,
          "application_fee_amount": null,
          "attempt_count": 0,
          "attempted": true,
          "auto_advance": false,
          "billing_reason": "subscription_create",
          "charge": null,
          "collection_method": "send_invoice",
          "created": 1580313946,
          "currency": "usd",
          "custom_fields": null,
          "customer": "cus_GLBNvU7Y4CEL02",
          "customer_address": {
              "city": "Amsterdam",
              "country": "Netherlands",
              "line1": "Orteliusstraat 217-2",
              "line2": "",
              "postal_code": "1056NR",
              "state": "Noord-Holland"
          },
          "customer_email": "info@playpost.app",
          "customer_name": "Playpost Demo",
          "customer_phone": "+31612706744",
          "customer_shipping": {
              "address": {
                  "city": "Amsterdam",
                  "country": "NL",
                  "line1": "Orteliusstraat 217-2",
                  "line2": "",
                  "postal_code": "1056NR",
                  "state": ""
              },
              "name": "Playpost",
              "phone": "+31612706744"
          },
          "customer_tax_exempt": "none",
          "customer_tax_ids": [],
          "default_payment_method": null,
          "default_source": null,
          "default_tax_rates": [],
          "description": null,
          "discount": null,
          "due_date": 1580918746,
          "ending_balance": 0,
          "footer": null,
          "hosted_invoice_url": "https://pay.stripe.com/invoice/invst_ftMsxh6eDvMXfTVG96BcT3xPVs",
          "invoice_pdf": "https://pay.stripe.com/invoice/invst_ftMsxh6eDvMXfTVG96BcT3xPVs/pdf",
          "lines": {
              "object": "list",
              "data": [
                  {
                      "id": "il_1G6J30LbygOvfi9oIUZ0SESO",
                      "object": "line_item",
                      "amount": 0,
                      "currency": "usd",
                      "description": "0 character × Pay Per Use (Free trial)",
                      "discountable": true,
                      "livemode": false,
                      "metadata": {},
                      "period": {
                          "end": 1580918446,
                          "start": 1580313946
                      },
                      "plan": {
                          "id": "plan_GNopHD0jFpD0zO",
                          "object": "plan",
                          "active": false,
                          "aggregate_usage": "sum",
                          "amount": null,
                          "amount_decimal": "0.05",
                          "billing_scheme": "per_unit",
                          "created": 1576678060,
                          "currency": "usd",
                          "interval": "month",
                          "interval_count": 1,
                          "livemode": false,
                          "metadata": {},
                          "nickname": "Monthly plan",
                          "product": "prod_GNoXV2xtX4zdOI",
                          "tiers": null,
                          "tiers_mode": null,
                          "transform_usage": null,
                          "trial_period_days": 7,
                          "usage_type": "metered"
                      },
                      "proration": false,
                      "quantity": 0,
                      "subscription": "sub_GdaDHFaxUwEY9w",
                      "subscription_item": "si_GdaDOoceL9NuW7",
                      "tax_amounts": [],
                      "tax_rates": [],
                      "type": "subscription"
                  }
              ],
              "has_more": false,
              "total_count": 1,
              "url": "/v1/invoices/in_1G6J30LbygOvfi9oa6tx9ERH/lines"
          },
          "livemode": false,
          "metadata": {},
          "next_payment_attempt": null,
          "number": "BAA92057-0010",
          "paid": true,
          "payment_intent": null,
          "period_end": 1580313946,
          "period_start": 1580313946,
          "post_payment_credit_notes_amount": 0,
          "pre_payment_credit_notes_amount": 0,
          "receipt_number": null,
          "starting_balance": 0,
          "statement_descriptor": null,
          "status": "paid",
          "status_transitions": {
              "finalized_at": 1581080793,
              "marked_uncollectible_at": null,
              "paid_at": 1581080793,
              "voided_at": null
          },
          "subscription": "sub_GdaDHFaxUwEY9w",
          "subtotal": 0,
          "tax": null,
          "tax_percent": null,
          "total": 0,
          "total_tax_amounts": [],
          "webhooks_delivered_at": 1580313947
      },
      "livemode": false,
      "metadata": {},
      "next_pending_invoice_item_invoice": null,
      "pending_invoice_item_interval": null,
      "pending_setup_intent": null,
      "pending_update": null,
      "plan": {
          "id": "plan_GNopHD0jFpD0zO",
          "object": "plan",
          "active": false,
          "aggregate_usage": "sum",
          "amount": null,
          "amount_decimal": "0.05",
          "billing_scheme": "per_unit",
          "created": 1576678060,
          "currency": "usd",
          "interval": "month",
          "interval_count": 1,
          "livemode": false,
          "metadata": {},
          "nickname": "Monthly plan",
          "product": {
              "id": "prod_GNoXV2xtX4zdOI",
              "object": "product",
              "deleted": true
          },
          "tiers": null,
          "tiers_mode": null,
          "transform_usage": null,
          "trial_period_days": 7,
          "usage_type": "metered"
      },
      "quantity": 1,
      "schedule": null,
      "start_date": 1580313946,
      "status": "canceled",
      "tax_percent": null,
      "trial_end": 1580918746,
      "trial_start": 1580313946
  },
  {
      "id": "sub_GdRjr05P6ETMkJ",
      "object": "subscription",
      "application_fee_percent": null,
      "billing_cycle_anchor": 1580887195,
      "billing_thresholds": null,
      "cancel_at": null,
      "cancel_at_period_end": false,
      "canceled_at": 1580313794,
      "collection_method": "send_invoice",
      "created": 1580282395,
      "current_period_end": 1580887195,
      "current_period_start": 1580282395,
      "customer": {
          "id": "cus_GLBNvU7Y4CEL02",
          "object": "customer",
          "address": {
              "city": "Amsterdam",
              "country": "NL",
              "line1": "Orteliusstraat 217-2",
              "line2": "",
              "postal_code": "1056NR",
              "state": "Noord Holland"
          },
          "balance": 0,
          "created": 1576070022,
          "currency": "usd",
          "default_source": null,
          "delinquent": false,
          "description": "Demo account Playpost",
          "discount": null,
          "email": "info@playpost.app",
          "invoice_prefix": "BAA92057",
          "invoice_settings": {
              "custom_fields": null,
              "default_payment_method": "pm_1GCRSVLbygOvfi9ojuY8DFOq",
              "footer": null
          },
          "livemode": false,
          "metadata": {
              "customerId": "494081aa-a8ab-47f7-8316-3b2badd2dac4",
              "organizationId": "97629636-b7ff-4766-8f9f-0742465682ba",
              "adminEmail": "jordyvandenaardweg@gmail.com"
          },
          "name": "Playpost Demo",
          "phone": "+31612706744",
          "preferred_locales": [
              "en"
          ],
          "shipping": null,
          "sources": {
              "object": "list",
              "data": [],
              "has_more": false,
              "total_count": 0,
              "url": "/v1/customers/cus_GLBNvU7Y4CEL02/sources"
          },
          "subscriptions": {
              "object": "list",
              "data": [
                  {
                      "id": "sub_GjAafbGOy50oNW",
                      "object": "subscription",
                      "application_fee_percent": null,
                      "billing_cycle_anchor": 1581602444,
                      "billing_thresholds": null,
                      "cancel_at": null,
                      "cancel_at_period_end": false,
                      "canceled_at": null,
                      "collection_method": "charge_automatically",
                      "created": 1581602444,
                      "current_period_end": 1581948044,
                      "current_period_start": 1581861644,
                      "customer": "cus_GLBNvU7Y4CEL02",
                      "days_until_due": null,
                      "default_payment_method": null,
                      "default_source": null,
                      "default_tax_rates": [
                          {
                              "id": "txr_1Fqzv1LbygOvfi9oYJqZckKS",
                              "object": "tax_rate",
                              "active": true,
                              "created": 1576665495,
                              "description": "BTW",
                              "display_name": "VAT",
                              "inclusive": false,
                              "jurisdiction": "NL",
                              "livemode": false,
                              "metadata": {},
                              "percentage": 21
                          }
                      ],
                      "discount": null,
                      "ended_at": null,
                      "items": {
                          "object": "list",
                          "data": [
                              {
                                  "id": "si_GjAaZXZqKBEJA8",
                                  "object": "subscription_item",
                                  "billing_thresholds": null,
                                  "created": 1581602444,
                                  "metadata": {},
                                  "plan": {
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
                                  },
                                  "subscription": "sub_GjAafbGOy50oNW",
                                  "tax_rates": []
                              }
                          ],
                          "has_more": false,
                          "total_count": 1,
                          "url": "/v1/subscription_items?subscription=sub_GjAafbGOy50oNW"
                      },
                      "latest_invoice": "in_1GCng0LbygOvfi9ocJ77YtCb",
                      "livemode": false,
                      "metadata": {},
                      "next_pending_invoice_item_invoice": null,
                      "pending_invoice_item_interval": null,
                      "pending_setup_intent": null,
                      "pending_update": null,
                      "plan": {
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
                      },
                      "quantity": 1,
                      "schedule": null,
                      "start_date": 1581602444,
                      "status": "active",
                      "tax_percent": 21,
                      "trial_end": null,
                      "trial_start": null
                  }
              ],
              "has_more": false,
              "total_count": 1,
              "url": "/v1/customers/cus_GLBNvU7Y4CEL02/subscriptions"
          },
          "tax_exempt": "none",
          "tax_ids": {
              "object": "list",
              "data": [
                  {
                      "id": "txi_1GCW7oLbygOvfi9oJXiEx2mv",
                      "object": "tax_id",
                      "country": "NL",
                      "created": 1581794184,
                      "customer": "cus_GLBNvU7Y4CEL02",
                      "livemode": false,
                      "type": "eu_vat",
                      "value": "NL002175463B65",
                      "verification": {
                          "status": "verified",
                          "verified_address": "123 TEST STREET",
                          "verified_name": "TEST"
                      }
                  }
              ],
              "has_more": false,
              "total_count": 1,
              "url": "/v1/customers/cus_GLBNvU7Y4CEL02/tax_ids"
          }
      },
      "days_until_due": 7,
      "default_payment_method": null,
      "default_source": null,
      "default_tax_rates": [],
      "discount": null,
      "ended_at": 1580313794,
      "items": {
          "object": "list",
          "data": [
              {
                  "id": "si_GdRjqb0DJrqhKy",
                  "object": "subscription_item",
                  "billing_thresholds": null,
                  "created": 1580282396,
                  "metadata": {},
                  "plan": {
                      "id": "plan_GNopHD0jFpD0zO",
                      "object": "plan",
                      "active": false,
                      "aggregate_usage": "sum",
                      "amount": null,
                      "amount_decimal": "0.05",
                      "billing_scheme": "per_unit",
                      "created": 1576678060,
                      "currency": "usd",
                      "interval": "month",
                      "interval_count": 1,
                      "livemode": false,
                      "metadata": {},
                      "nickname": "Monthly plan",
                      "product": "prod_GNoXV2xtX4zdOI",
                      "tiers": null,
                      "tiers_mode": null,
                      "transform_usage": null,
                      "trial_period_days": 7,
                      "usage_type": "metered"
                  },
                  "subscription": "sub_GdRjr05P6ETMkJ",
                  "tax_rates": []
              }
          ],
          "has_more": false,
          "total_count": 1,
          "url": "/v1/subscription_items?subscription=sub_GdRjr05P6ETMkJ"
      },
      "latest_invoice": {
          "id": "in_1G6Aq7LbygOvfi9oK9hGDP7r",
          "object": "invoice",
          "account_country": "NL",
          "account_name": "Playpost",
          "amount_due": 0,
          "amount_paid": 0,
          "amount_remaining": 0,
          "application_fee_amount": null,
          "attempt_count": 0,
          "attempted": true,
          "auto_advance": false,
          "billing_reason": "subscription_create",
          "charge": null,
          "collection_method": "send_invoice",
          "created": 1580282395,
          "currency": "usd",
          "custom_fields": null,
          "customer": "cus_GLBNvU7Y4CEL02",
          "customer_address": {
              "city": "Amsterdam",
              "country": "Netherlands",
              "line1": "Orteliusstraat 217-2",
              "line2": "",
              "postal_code": "1056NR",
              "state": "Noord-Holland"
          },
          "customer_email": "info@playpost.app",
          "customer_name": "Playpost Demo",
          "customer_phone": "+31612706744",
          "customer_shipping": {
              "address": {
                  "city": "Amsterdam",
                  "country": "NL",
                  "line1": "Orteliusstraat 217-2",
                  "line2": "",
                  "postal_code": "1056NR",
                  "state": ""
              },
              "name": "Playpost",
              "phone": "+31612706744"
          },
          "customer_tax_exempt": "none",
          "customer_tax_ids": [],
          "default_payment_method": null,
          "default_source": null,
          "default_tax_rates": [],
          "description": null,
          "discount": null,
          "due_date": 1580887195,
          "ending_balance": 0,
          "footer": null,
          "hosted_invoice_url": "https://pay.stripe.com/invoice/invst_wSp50KvNx2oBihND6lI48can5O",
          "invoice_pdf": "https://pay.stripe.com/invoice/invst_wSp50KvNx2oBihND6lI48can5O/pdf",
          "lines": {
              "object": "list",
              "data": [
                  {
                      "id": "il_1G6Aq7LbygOvfi9oU3BogMhT",
                      "object": "line_item",
                      "amount": 0,
                      "currency": "usd",
                      "description": "0 character × Pay Per Use (Free trial)",
                      "discountable": true,
                      "livemode": false,
                      "metadata": {},
                      "period": {
                          "end": 1580886895,
                          "start": 1580282395
                      },
                      "plan": {
                          "id": "plan_GNopHD0jFpD0zO",
                          "object": "plan",
                          "active": false,
                          "aggregate_usage": "sum",
                          "amount": null,
                          "amount_decimal": "0.05",
                          "billing_scheme": "per_unit",
                          "created": 1576678060,
                          "currency": "usd",
                          "interval": "month",
                          "interval_count": 1,
                          "livemode": false,
                          "metadata": {},
                          "nickname": "Monthly plan",
                          "product": "prod_GNoXV2xtX4zdOI",
                          "tiers": null,
                          "tiers_mode": null,
                          "transform_usage": null,
                          "trial_period_days": 7,
                          "usage_type": "metered"
                      },
                      "proration": false,
                      "quantity": 0,
                      "subscription": "sub_GdRjr05P6ETMkJ",
                      "subscription_item": "si_GdRjqb0DJrqhKy",
                      "tax_amounts": [],
                      "tax_rates": [],
                      "type": "subscription"
                  }
              ],
              "has_more": false,
              "total_count": 1,
              "url": "/v1/invoices/in_1G6Aq7LbygOvfi9oK9hGDP7r/lines"
          },
          "livemode": false,
          "metadata": {},
          "next_payment_attempt": null,
          "number": "BAA92057-0009",
          "paid": true,
          "payment_intent": null,
          "period_end": 1580282395,
          "period_start": 1580282395,
          "post_payment_credit_notes_amount": 0,
          "pre_payment_credit_notes_amount": 0,
          "receipt_number": null,
          "starting_balance": 0,
          "statement_descriptor": null,
          "status": "paid",
          "status_transitions": {
              "finalized_at": 1580286003,
              "marked_uncollectible_at": null,
              "paid_at": 1580286003,
              "voided_at": null
          },
          "subscription": "sub_GdRjr05P6ETMkJ",
          "subtotal": 0,
          "tax": null,
          "tax_percent": null,
          "total": 0,
          "total_tax_amounts": [],
          "webhooks_delivered_at": 1580282398
      },
      "livemode": false,
      "metadata": {},
      "next_pending_invoice_item_invoice": null,
      "pending_invoice_item_interval": null,
      "pending_setup_intent": null,
      "pending_update": null,
      "plan": {
          "id": "plan_GNopHD0jFpD0zO",
          "object": "plan",
          "active": false,
          "aggregate_usage": "sum",
          "amount": null,
          "amount_decimal": "0.05",
          "billing_scheme": "per_unit",
          "created": 1576678060,
          "currency": "usd",
          "interval": "month",
          "interval_count": 1,
          "livemode": false,
          "metadata": {},
          "nickname": "Monthly plan",
          "product": {
              "id": "prod_GNoXV2xtX4zdOI",
              "object": "product",
              "deleted": true
          },
          "tiers": null,
          "tiers_mode": null,
          "transform_usage": null,
          "trial_period_days": 7,
          "usage_type": "metered"
      },
      "quantity": 1,
      "schedule": null,
      "start_date": 1580282395,
      "status": "canceled",
      "tax_percent": null,
      "trial_end": 1580887195,
      "trial_start": 1580282395
  },
  {
      "id": "sub_GNqvbWQaW0OeZa",
      "object": "subscription",
      "application_fee_percent": null,
      "billing_cycle_anchor": 1577290692,
      "billing_thresholds": null,
      "cancel_at": null,
      "cancel_at_period_end": false,
      "canceled_at": 1580281620,
      "collection_method": "send_invoice",
      "created": 1576685892,
      "current_period_end": 1582647492,
      "current_period_start": 1579969092,
      "customer": {
          "id": "cus_GLBNvU7Y4CEL02",
          "object": "customer",
          "address": {
              "city": "Amsterdam",
              "country": "NL",
              "line1": "Orteliusstraat 217-2",
              "line2": "",
              "postal_code": "1056NR",
              "state": "Noord Holland"
          },
          "balance": 0,
          "created": 1576070022,
          "currency": "usd",
          "default_source": null,
          "delinquent": false,
          "description": "Demo account Playpost",
          "discount": null,
          "email": "info@playpost.app",
          "invoice_prefix": "BAA92057",
          "invoice_settings": {
              "custom_fields": null,
              "default_payment_method": "pm_1GCRSVLbygOvfi9ojuY8DFOq",
              "footer": null
          },
          "livemode": false,
          "metadata": {
              "customerId": "494081aa-a8ab-47f7-8316-3b2badd2dac4",
              "organizationId": "97629636-b7ff-4766-8f9f-0742465682ba",
              "adminEmail": "jordyvandenaardweg@gmail.com"
          },
          "name": "Playpost Demo",
          "phone": "+31612706744",
          "preferred_locales": [
              "en"
          ],
          "shipping": null,
          "sources": {
              "object": "list",
              "data": [],
              "has_more": false,
              "total_count": 0,
              "url": "/v1/customers/cus_GLBNvU7Y4CEL02/sources"
          },
          "subscriptions": {
              "object": "list",
              "data": [
                  {
                      "id": "sub_GjAafbGOy50oNW",
                      "object": "subscription",
                      "application_fee_percent": null,
                      "billing_cycle_anchor": 1581602444,
                      "billing_thresholds": null,
                      "cancel_at": null,
                      "cancel_at_period_end": false,
                      "canceled_at": null,
                      "collection_method": "charge_automatically",
                      "created": 1581602444,
                      "current_period_end": 1581948044,
                      "current_period_start": 1581861644,
                      "customer": "cus_GLBNvU7Y4CEL02",
                      "days_until_due": null,
                      "default_payment_method": null,
                      "default_source": null,
                      "default_tax_rates": [
                          {
                              "id": "txr_1Fqzv1LbygOvfi9oYJqZckKS",
                              "object": "tax_rate",
                              "active": true,
                              "created": 1576665495,
                              "description": "BTW",
                              "display_name": "VAT",
                              "inclusive": false,
                              "jurisdiction": "NL",
                              "livemode": false,
                              "metadata": {},
                              "percentage": 21
                          }
                      ],
                      "discount": null,
                      "ended_at": null,
                      "items": {
                          "object": "list",
                          "data": [
                              {
                                  "id": "si_GjAaZXZqKBEJA8",
                                  "object": "subscription_item",
                                  "billing_thresholds": null,
                                  "created": 1581602444,
                                  "metadata": {},
                                  "plan": {
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
                                  },
                                  "subscription": "sub_GjAafbGOy50oNW",
                                  "tax_rates": []
                              }
                          ],
                          "has_more": false,
                          "total_count": 1,
                          "url": "/v1/subscription_items?subscription=sub_GjAafbGOy50oNW"
                      },
                      "latest_invoice": "in_1GCng0LbygOvfi9ocJ77YtCb",
                      "livemode": false,
                      "metadata": {},
                      "next_pending_invoice_item_invoice": null,
                      "pending_invoice_item_interval": null,
                      "pending_setup_intent": null,
                      "pending_update": null,
                      "plan": {
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
                      },
                      "quantity": 1,
                      "schedule": null,
                      "start_date": 1581602444,
                      "status": "active",
                      "tax_percent": 21,
                      "trial_end": null,
                      "trial_start": null
                  }
              ],
              "has_more": false,
              "total_count": 1,
              "url": "/v1/customers/cus_GLBNvU7Y4CEL02/subscriptions"
          },
          "tax_exempt": "none",
          "tax_ids": {
              "object": "list",
              "data": [
                  {
                      "id": "txi_1GCW7oLbygOvfi9oJXiEx2mv",
                      "object": "tax_id",
                      "country": "NL",
                      "created": 1581794184,
                      "customer": "cus_GLBNvU7Y4CEL02",
                      "livemode": false,
                      "type": "eu_vat",
                      "value": "NL002175463B65",
                      "verification": {
                          "status": "verified",
                          "verified_address": "123 TEST STREET",
                          "verified_name": "TEST"
                      }
                  }
              ],
              "has_more": false,
              "total_count": 1,
              "url": "/v1/customers/cus_GLBNvU7Y4CEL02/tax_ids"
          }
      },
      "days_until_due": 7,
      "default_payment_method": null,
      "default_source": null,
      "default_tax_rates": [],
      "discount": null,
      "ended_at": 1580281620,
      "items": {
          "object": "list",
          "data": [
              {
                  "id": "si_GNqv4VElqK3g7I",
                  "object": "subscription_item",
                  "billing_thresholds": null,
                  "created": 1576685892,
                  "metadata": {},
                  "plan": {
                      "id": "plan_GNopHD0jFpD0zO",
                      "object": "plan",
                      "active": false,
                      "aggregate_usage": "sum",
                      "amount": null,
                      "amount_decimal": "0.05",
                      "billing_scheme": "per_unit",
                      "created": 1576678060,
                      "currency": "usd",
                      "interval": "month",
                      "interval_count": 1,
                      "livemode": false,
                      "metadata": {},
                      "nickname": "Monthly plan",
                      "product": "prod_GNoXV2xtX4zdOI",
                      "tiers": null,
                      "tiers_mode": null,
                      "transform_usage": null,
                      "trial_period_days": 7,
                      "usage_type": "metered"
                  },
                  "subscription": "sub_GNqvbWQaW0OeZa",
                  "tax_rates": []
              }
          ],
          "has_more": false,
          "total_count": 1,
          "url": "/v1/subscription_items?subscription=sub_GNqvbWQaW0OeZa"
      },
      "latest_invoice": {
          "id": "in_1G6AdcLbygOvfi9oauOmL92C",
          "object": "invoice",
          "account_country": "NL",
          "account_name": "Playpost",
          "amount_due": 0,
          "amount_paid": 0,
          "amount_remaining": 0,
          "application_fee_amount": null,
          "attempt_count": 0,
          "attempted": true,
          "auto_advance": false,
          "billing_reason": "subscription_cycle",
          "charge": null,
          "collection_method": "send_invoice",
          "created": 1580281620,
          "currency": "usd",
          "custom_fields": null,
          "customer": "cus_GLBNvU7Y4CEL02",
          "customer_address": {
              "city": "Amsterdam",
              "country": "Netherlands",
              "line1": "Orteliusstraat 217-2",
              "line2": "",
              "postal_code": "1056NR",
              "state": "Noord-Holland"
          },
          "customer_email": "info@playpost.app",
          "customer_name": "Playpost Demo",
          "customer_phone": "+31612706744",
          "customer_shipping": {
              "address": {
                  "city": "Amsterdam",
                  "country": "NL",
                  "line1": "Orteliusstraat 217-2",
                  "line2": "",
                  "postal_code": "1056NR",
                  "state": ""
              },
              "name": "Playpost",
              "phone": "+31612706744"
          },
          "customer_tax_exempt": "none",
          "customer_tax_ids": [],
          "default_payment_method": null,
          "default_source": null,
          "default_tax_rates": [],
          "description": null,
          "discount": null,
          "due_date": 1580886420,
          "ending_balance": 0,
          "footer": null,
          "hosted_invoice_url": "https://pay.stripe.com/invoice/invst_3RvaslfOxUotG09vSfNTNM2OwO",
          "invoice_pdf": "https://pay.stripe.com/invoice/invst_3RvaslfOxUotG09vSfNTNM2OwO/pdf",
          "lines": {
              "object": "list",
              "data": [
                  {
                      "id": "il_1G6AdcLbygOvfi9o0BBcLc9w",
                      "object": "line_item",
                      "amount": 0,
                      "currency": "usd",
                      "description": "0 character × Pay Per Use (at $0.0005 / month)",
                      "discountable": true,
                      "livemode": false,
                      "metadata": {},
                      "period": {
                          "end": 1580281320,
                          "start": 1579968797
                      },
                      "plan": {
                          "id": "plan_GNopHD0jFpD0zO",
                          "object": "plan",
                          "active": false,
                          "aggregate_usage": "sum",
                          "amount": null,
                          "amount_decimal": "0.05",
                          "billing_scheme": "per_unit",
                          "created": 1576678060,
                          "currency": "usd",
                          "interval": "month",
                          "interval_count": 1,
                          "livemode": false,
                          "metadata": {},
                          "nickname": "Monthly plan",
                          "product": "prod_GNoXV2xtX4zdOI",
                          "tiers": null,
                          "tiers_mode": null,
                          "transform_usage": null,
                          "trial_period_days": 7,
                          "usage_type": "metered"
                      },
                      "proration": false,
                      "quantity": 0,
                      "subscription": "sub_GNqvbWQaW0OeZa",
                      "subscription_item": "si_GNqv4VElqK3g7I",
                      "tax_amounts": [],
                      "tax_rates": [],
                      "type": "subscription"
                  }
              ],
              "has_more": false,
              "total_count": 1,
              "url": "/v1/invoices/in_1G6AdcLbygOvfi9oauOmL92C/lines"
          },
          "livemode": false,
          "metadata": {},
          "next_payment_attempt": null,
          "number": "BAA92057-0008",
          "paid": true,
          "payment_intent": null,
          "period_end": 1580281620,
          "period_start": 1579969092,
          "post_payment_credit_notes_amount": 0,
          "pre_payment_credit_notes_amount": 0,
          "receipt_number": null,
          "starting_balance": 0,
          "statement_descriptor": null,
          "status": "paid",
          "status_transitions": {
              "finalized_at": 1580285240,
              "marked_uncollectible_at": null,
              "paid_at": 1580285240,
              "voided_at": null
          },
          "subscription": "sub_GNqvbWQaW0OeZa",
          "subtotal": 0,
          "tax": null,
          "tax_percent": null,
          "total": 0,
          "total_tax_amounts": [],
          "webhooks_delivered_at": 1580281624
      },
      "livemode": false,
      "metadata": {},
      "next_pending_invoice_item_invoice": null,
      "pending_invoice_item_interval": null,
      "pending_setup_intent": null,
      "pending_update": null,
      "plan": {
          "id": "plan_GNopHD0jFpD0zO",
          "object": "plan",
          "active": false,
          "aggregate_usage": "sum",
          "amount": null,
          "amount_decimal": "0.05",
          "billing_scheme": "per_unit",
          "created": 1576678060,
          "currency": "usd",
          "interval": "month",
          "interval_count": 1,
          "livemode": false,
          "metadata": {},
          "nickname": "Monthly plan",
          "product": {
              "id": "prod_GNoXV2xtX4zdOI",
              "object": "product",
              "deleted": true
          },
          "tiers": null,
          "tiers_mode": null,
          "transform_usage": null,
          "trial_period_days": 7,
          "usage_type": "metered"
      },
      "quantity": 1,
      "schedule": null,
      "start_date": 1576685892,
      "status": "canceled",
      "tax_percent": null,
      "trial_end": 1577290692,
      "trial_start": 1576685892
  },
  {
      "id": "sub_GNqWJKodJdEeXG",
      "object": "subscription",
      "application_fee_percent": null,
      "billing_cycle_anchor": 1576684384,
      "billing_thresholds": null,
      "cancel_at": null,
      "cancel_at_period_end": false,
      "canceled_at": 1576685831,
      "collection_method": "charge_automatically",
      "created": 1576684384,
      "current_period_end": 1579362784,
      "current_period_start": 1576684384,
      "customer": {
          "id": "cus_GLBNvU7Y4CEL02",
          "object": "customer",
          "address": {
              "city": "Amsterdam",
              "country": "NL",
              "line1": "Orteliusstraat 217-2",
              "line2": "",
              "postal_code": "1056NR",
              "state": "Noord Holland"
          },
          "balance": 0,
          "created": 1576070022,
          "currency": "usd",
          "default_source": null,
          "delinquent": false,
          "description": "Demo account Playpost",
          "discount": null,
          "email": "info@playpost.app",
          "invoice_prefix": "BAA92057",
          "invoice_settings": {
              "custom_fields": null,
              "default_payment_method": "pm_1GCRSVLbygOvfi9ojuY8DFOq",
              "footer": null
          },
          "livemode": false,
          "metadata": {
              "customerId": "494081aa-a8ab-47f7-8316-3b2badd2dac4",
              "organizationId": "97629636-b7ff-4766-8f9f-0742465682ba",
              "adminEmail": "jordyvandenaardweg@gmail.com"
          },
          "name": "Playpost Demo",
          "phone": "+31612706744",
          "preferred_locales": [
              "en"
          ],
          "shipping": null,
          "sources": {
              "object": "list",
              "data": [],
              "has_more": false,
              "total_count": 0,
              "url": "/v1/customers/cus_GLBNvU7Y4CEL02/sources"
          },
          "subscriptions": {
              "object": "list",
              "data": [
                  {
                      "id": "sub_GjAafbGOy50oNW",
                      "object": "subscription",
                      "application_fee_percent": null,
                      "billing_cycle_anchor": 1581602444,
                      "billing_thresholds": null,
                      "cancel_at": null,
                      "cancel_at_period_end": false,
                      "canceled_at": null,
                      "collection_method": "charge_automatically",
                      "created": 1581602444,
                      "current_period_end": 1581948044,
                      "current_period_start": 1581861644,
                      "customer": "cus_GLBNvU7Y4CEL02",
                      "days_until_due": null,
                      "default_payment_method": null,
                      "default_source": null,
                      "default_tax_rates": [
                          {
                              "id": "txr_1Fqzv1LbygOvfi9oYJqZckKS",
                              "object": "tax_rate",
                              "active": true,
                              "created": 1576665495,
                              "description": "BTW",
                              "display_name": "VAT",
                              "inclusive": false,
                              "jurisdiction": "NL",
                              "livemode": false,
                              "metadata": {},
                              "percentage": 21
                          }
                      ],
                      "discount": null,
                      "ended_at": null,
                      "items": {
                          "object": "list",
                          "data": [
                              {
                                  "id": "si_GjAaZXZqKBEJA8",
                                  "object": "subscription_item",
                                  "billing_thresholds": null,
                                  "created": 1581602444,
                                  "metadata": {},
                                  "plan": {
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
                                  },
                                  "subscription": "sub_GjAafbGOy50oNW",
                                  "tax_rates": []
                              }
                          ],
                          "has_more": false,
                          "total_count": 1,
                          "url": "/v1/subscription_items?subscription=sub_GjAafbGOy50oNW"
                      },
                      "latest_invoice": "in_1GCng0LbygOvfi9ocJ77YtCb",
                      "livemode": false,
                      "metadata": {},
                      "next_pending_invoice_item_invoice": null,
                      "pending_invoice_item_interval": null,
                      "pending_setup_intent": null,
                      "pending_update": null,
                      "plan": {
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
                      },
                      "quantity": 1,
                      "schedule": null,
                      "start_date": 1581602444,
                      "status": "active",
                      "tax_percent": 21,
                      "trial_end": null,
                      "trial_start": null
                  }
              ],
              "has_more": false,
              "total_count": 1,
              "url": "/v1/customers/cus_GLBNvU7Y4CEL02/subscriptions"
          },
          "tax_exempt": "none",
          "tax_ids": {
              "object": "list",
              "data": [
                  {
                      "id": "txi_1GCW7oLbygOvfi9oJXiEx2mv",
                      "object": "tax_id",
                      "country": "NL",
                      "created": 1581794184,
                      "customer": "cus_GLBNvU7Y4CEL02",
                      "livemode": false,
                      "type": "eu_vat",
                      "value": "NL002175463B65",
                      "verification": {
                          "status": "verified",
                          "verified_address": "123 TEST STREET",
                          "verified_name": "TEST"
                      }
                  }
              ],
              "has_more": false,
              "total_count": 1,
              "url": "/v1/customers/cus_GLBNvU7Y4CEL02/tax_ids"
          }
      },
      "days_until_due": null,
      "default_payment_method": null,
      "default_source": null,
      "default_tax_rates": [
          {
              "id": "txr_1Fqzv1LbygOvfi9oYJqZckKS",
              "object": "tax_rate",
              "active": true,
              "created": 1576665495,
              "description": "BTW",
              "display_name": "VAT",
              "inclusive": false,
              "jurisdiction": "NL",
              "livemode": false,
              "metadata": {},
              "percentage": 21
          }
      ],
      "discount": null,
      "ended_at": 1576685831,
      "items": {
          "object": "list",
          "data": [
              {
                  "id": "si_GNqWh71i4ccunY",
                  "object": "subscription_item",
                  "billing_thresholds": null,
                  "created": 1576684384,
                  "metadata": {},
                  "plan": {
                      "id": "plan_GNopHD0jFpD0zO",
                      "object": "plan",
                      "active": false,
                      "aggregate_usage": "sum",
                      "amount": null,
                      "amount_decimal": "0.05",
                      "billing_scheme": "per_unit",
                      "created": 1576678060,
                      "currency": "usd",
                      "interval": "month",
                      "interval_count": 1,
                      "livemode": false,
                      "metadata": {},
                      "nickname": "Monthly plan",
                      "product": "prod_GNoXV2xtX4zdOI",
                      "tiers": null,
                      "tiers_mode": null,
                      "transform_usage": null,
                      "trial_period_days": 7,
                      "usage_type": "metered"
                  },
                  "subscription": "sub_GNqWJKodJdEeXG",
                  "tax_rates": []
              }
          ],
          "has_more": false,
          "total_count": 1,
          "url": "/v1/subscription_items?subscription=sub_GNqWJKodJdEeXG"
      },
      "latest_invoice": {
          "id": "in_1Fr5D1LbygOvfi9oKskd77OC",
          "object": "invoice",
          "account_country": "NL",
          "account_name": "Playpost",
          "amount_due": 0,
          "amount_paid": 0,
          "amount_remaining": 0,
          "application_fee_amount": null,
          "attempt_count": 0,
          "attempted": true,
          "auto_advance": false,
          "billing_reason": "subscription_cycle",
          "charge": null,
          "collection_method": "charge_automatically",
          "created": 1576685831,
          "currency": "usd",
          "custom_fields": null,
          "customer": "cus_GLBNvU7Y4CEL02",
          "customer_address": {
              "city": "Amsterdam",
              "country": "Netherlands",
              "line1": "Orteliusstraat 217-2",
              "line2": "",
              "postal_code": "1056NR",
              "state": "Noord-Holland"
          },
          "customer_email": "info@playpost.app",
          "customer_name": "Playpost Demo",
          "customer_phone": "+31612706744",
          "customer_shipping": {
              "address": {
                  "city": "Amsterdam",
                  "country": "NL",
                  "line1": "Orteliusstraat 217-2",
                  "line2": "",
                  "postal_code": "1056NR",
                  "state": ""
              },
              "name": "Playpost",
              "phone": "+31612706744"
          },
          "customer_tax_exempt": "none",
          "customer_tax_ids": [],
          "default_payment_method": null,
          "default_source": null,
          "default_tax_rates": [
              {
                  "id": "txr_1Fqzv1LbygOvfi9oYJqZckKS",
                  "object": "tax_rate",
                  "active": true,
                  "created": 1576665495,
                  "description": "BTW",
                  "display_name": "VAT",
                  "inclusive": false,
                  "jurisdiction": "NL",
                  "livemode": false,
                  "metadata": {},
                  "percentage": 21
              }
          ],
          "description": null,
          "discount": null,
          "due_date": null,
          "ending_balance": 0,
          "footer": null,
          "hosted_invoice_url": "https://pay.stripe.com/invoice/invst_DbCNiKXs6ITPeS8IohBxGd96TA",
          "invoice_pdf": "https://pay.stripe.com/invoice/invst_DbCNiKXs6ITPeS8IohBxGd96TA/pdf",
          "lines": {
              "object": "list",
              "data": [
                  {
                      "id": "il_1Fr5D1LbygOvfi9oOC3F3p5n",
                      "object": "line_item",
                      "amount": 0,
                      "currency": "usd",
                      "description": "0 character × Pay Per Use (at $0.0005 / month)",
                      "discountable": true,
                      "livemode": false,
                      "metadata": {},
                      "period": {
                          "end": 1576685531,
                          "start": 1576684384
                      },
                      "plan": {
                          "id": "plan_GNopHD0jFpD0zO",
                          "object": "plan",
                          "active": false,
                          "aggregate_usage": "sum",
                          "amount": null,
                          "amount_decimal": "0.05",
                          "billing_scheme": "per_unit",
                          "created": 1576678060,
                          "currency": "usd",
                          "interval": "month",
                          "interval_count": 1,
                          "livemode": false,
                          "metadata": {},
                          "nickname": "Monthly plan",
                          "product": "prod_GNoXV2xtX4zdOI",
                          "tiers": null,
                          "tiers_mode": null,
                          "transform_usage": null,
                          "trial_period_days": 7,
                          "usage_type": "metered"
                      },
                      "proration": false,
                      "quantity": 0,
                      "subscription": "sub_GNqWJKodJdEeXG",
                      "subscription_item": "si_GNqWh71i4ccunY",
                      "tax_amounts": [
                          {
                              "amount": 0,
                              "inclusive": false,
                              "tax_rate": "txr_1Fqzv1LbygOvfi9oYJqZckKS"
                          }
                      ],
                      "tax_rates": [],
                      "type": "subscription"
                  }
              ],
              "has_more": false,
              "total_count": 1,
              "url": "/v1/invoices/in_1Fr5D1LbygOvfi9oKskd77OC/lines"
          },
          "livemode": false,
          "metadata": {},
          "next_payment_attempt": null,
          "number": "BAA92057-0004",
          "paid": true,
          "payment_intent": null,
          "period_end": 1576685831,
          "period_start": 1576684384,
          "post_payment_credit_notes_amount": 0,
          "pre_payment_credit_notes_amount": 0,
          "receipt_number": null,
          "starting_balance": 0,
          "statement_descriptor": null,
          "status": "paid",
          "status_transitions": {
              "finalized_at": 1576726091,
              "marked_uncollectible_at": null,
              "paid_at": 1576726091,
              "voided_at": null
          },
          "subscription": "sub_GNqWJKodJdEeXG",
          "subtotal": 0,
          "tax": 0,
          "tax_percent": 21,
          "total": 0,
          "total_tax_amounts": [
              {
                  "amount": 0,
                  "inclusive": false,
                  "tax_rate": "txr_1Fqzv1LbygOvfi9oYJqZckKS"
              }
          ],
          "webhooks_delivered_at": 1576685832
      },
      "livemode": false,
      "metadata": {},
      "next_pending_invoice_item_invoice": null,
      "pending_invoice_item_interval": null,
      "pending_setup_intent": null,
      "pending_update": null,
      "plan": {
          "id": "plan_GNopHD0jFpD0zO",
          "object": "plan",
          "active": false,
          "aggregate_usage": "sum",
          "amount": null,
          "amount_decimal": "0.05",
          "billing_scheme": "per_unit",
          "created": 1576678060,
          "currency": "usd",
          "interval": "month",
          "interval_count": 1,
          "livemode": false,
          "metadata": {},
          "nickname": "Monthly plan",
          "product": {
              "id": "prod_GNoXV2xtX4zdOI",
              "object": "product",
              "deleted": true
          },
          "tiers": null,
          "tiers_mode": null,
          "transform_usage": null,
          "trial_period_days": 7,
          "usage_type": "metered"
      },
      "quantity": 1,
      "schedule": null,
      "start_date": 1576684384,
      "status": "canceled",
      "tax_percent": 21,
      "trial_end": null,
      "trial_start": null
  },
  {
      "id": "sub_GNKb05bvWL9vsy",
      "object": "subscription",
      "application_fee_percent": null,
      "billing_cycle_anchor": 1577170453,
      "billing_thresholds": null,
      "cancel_at": null,
      "cancel_at_period_end": false,
      "canceled_at": 1576684299,
      "collection_method": "charge_automatically",
      "created": 1576565653,
      "current_period_end": 1577170453,
      "current_period_start": 1576565653,
      "customer": {
          "id": "cus_GLBNvU7Y4CEL02",
          "object": "customer",
          "address": {
              "city": "Amsterdam",
              "country": "NL",
              "line1": "Orteliusstraat 217-2",
              "line2": "",
              "postal_code": "1056NR",
              "state": "Noord Holland"
          },
          "balance": 0,
          "created": 1576070022,
          "currency": "usd",
          "default_source": null,
          "delinquent": false,
          "description": "Demo account Playpost",
          "discount": null,
          "email": "info@playpost.app",
          "invoice_prefix": "BAA92057",
          "invoice_settings": {
              "custom_fields": null,
              "default_payment_method": "pm_1GCRSVLbygOvfi9ojuY8DFOq",
              "footer": null
          },
          "livemode": false,
          "metadata": {
              "customerId": "494081aa-a8ab-47f7-8316-3b2badd2dac4",
              "organizationId": "97629636-b7ff-4766-8f9f-0742465682ba",
              "adminEmail": "jordyvandenaardweg@gmail.com"
          },
          "name": "Playpost Demo",
          "phone": "+31612706744",
          "preferred_locales": [
              "en"
          ],
          "shipping": null,
          "sources": {
              "object": "list",
              "data": [],
              "has_more": false,
              "total_count": 0,
              "url": "/v1/customers/cus_GLBNvU7Y4CEL02/sources"
          },
          "subscriptions": {
              "object": "list",
              "data": [
                  {
                      "id": "sub_GjAafbGOy50oNW",
                      "object": "subscription",
                      "application_fee_percent": null,
                      "billing_cycle_anchor": 1581602444,
                      "billing_thresholds": null,
                      "cancel_at": null,
                      "cancel_at_period_end": false,
                      "canceled_at": null,
                      "collection_method": "charge_automatically",
                      "created": 1581602444,
                      "current_period_end": 1581948044,
                      "current_period_start": 1581861644,
                      "customer": "cus_GLBNvU7Y4CEL02",
                      "days_until_due": null,
                      "default_payment_method": null,
                      "default_source": null,
                      "default_tax_rates": [
                          {
                              "id": "txr_1Fqzv1LbygOvfi9oYJqZckKS",
                              "object": "tax_rate",
                              "active": true,
                              "created": 1576665495,
                              "description": "BTW",
                              "display_name": "VAT",
                              "inclusive": false,
                              "jurisdiction": "NL",
                              "livemode": false,
                              "metadata": {},
                              "percentage": 21
                          }
                      ],
                      "discount": null,
                      "ended_at": null,
                      "items": {
                          "object": "list",
                          "data": [
                              {
                                  "id": "si_GjAaZXZqKBEJA8",
                                  "object": "subscription_item",
                                  "billing_thresholds": null,
                                  "created": 1581602444,
                                  "metadata": {},
                                  "plan": {
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
                                  },
                                  "subscription": "sub_GjAafbGOy50oNW",
                                  "tax_rates": []
                              }
                          ],
                          "has_more": false,
                          "total_count": 1,
                          "url": "/v1/subscription_items?subscription=sub_GjAafbGOy50oNW"
                      },
                      "latest_invoice": "in_1GCng0LbygOvfi9ocJ77YtCb",
                      "livemode": false,
                      "metadata": {},
                      "next_pending_invoice_item_invoice": null,
                      "pending_invoice_item_interval": null,
                      "pending_setup_intent": null,
                      "pending_update": null,
                      "plan": {
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
                      },
                      "quantity": 1,
                      "schedule": null,
                      "start_date": 1581602444,
                      "status": "active",
                      "tax_percent": 21,
                      "trial_end": null,
                      "trial_start": null
                  }
              ],
              "has_more": false,
              "total_count": 1,
              "url": "/v1/customers/cus_GLBNvU7Y4CEL02/subscriptions"
          },
          "tax_exempt": "none",
          "tax_ids": {
              "object": "list",
              "data": [
                  {
                      "id": "txi_1GCW7oLbygOvfi9oJXiEx2mv",
                      "object": "tax_id",
                      "country": "NL",
                      "created": 1581794184,
                      "customer": "cus_GLBNvU7Y4CEL02",
                      "livemode": false,
                      "type": "eu_vat",
                      "value": "NL002175463B65",
                      "verification": {
                          "status": "verified",
                          "verified_address": "123 TEST STREET",
                          "verified_name": "TEST"
                      }
                  }
              ],
              "has_more": false,
              "total_count": 1,
              "url": "/v1/customers/cus_GLBNvU7Y4CEL02/tax_ids"
          }
      },
      "days_until_due": null,
      "default_payment_method": null,
      "default_source": null,
      "default_tax_rates": [
          {
              "id": "txr_1Fqzv1LbygOvfi9oYJqZckKS",
              "object": "tax_rate",
              "active": true,
              "created": 1576665495,
              "description": "BTW",
              "display_name": "VAT",
              "inclusive": false,
              "jurisdiction": "NL",
              "livemode": false,
              "metadata": {},
              "percentage": 21
          }
      ],
      "discount": null,
      "ended_at": 1576684299,
      "items": {
          "object": "list",
          "data": [
              {
                  "id": "si_GNKbK8bT1KAa6A",
                  "object": "subscription_item",
                  "billing_thresholds": null,
                  "created": 1576565654,
                  "metadata": {},
                  "plan": {
                      "id": "plan_GLVHSLbMkT1UX8",
                      "object": "plan",
                      "active": false,
                      "aggregate_usage": "sum",
                      "amount": null,
                      "amount_decimal": null,
                      "billing_scheme": "tiered",
                      "created": 1576144092,
                      "currency": "usd",
                      "interval": "month",
                      "interval_count": 1,
                      "livemode": false,
                      "metadata": {},
                      "nickname": "Monthly plan",
                      "product": "prod_GLVB5oHF6RfalZ",
                      "tiers": [
                          {
                              "flat_amount": 999,
                              "flat_amount_decimal": "999",
                              "unit_amount": 0,
                              "unit_amount_decimal": "0",
                              "up_to": 100000
                          },
                          {
                              "flat_amount": null,
                              "flat_amount_decimal": null,
                              "unit_amount": null,
                              "unit_amount_decimal": "0.016",
                              "up_to": null
                          }
                      ],
                      "tiers_mode": "graduated",
                      "transform_usage": null,
                      "trial_period_days": 1,
                      "usage_type": "metered"
                  },
                  "subscription": "sub_GNKb05bvWL9vsy",
                  "tax_rates": []
              }
          ],
          "has_more": false,
          "total_count": 1,
          "url": "/v1/subscription_items?subscription=sub_GNKb05bvWL9vsy"
      },
      "latest_invoice": {
          "id": "in_1Fr4oJLbygOvfi9ozEcWIYnZ",
          "object": "invoice",
          "account_country": "NL",
          "account_name": "Playpost",
          "amount_due": 0,
          "amount_paid": 0,
          "amount_remaining": 0,
          "application_fee_amount": null,
          "attempt_count": 0,
          "attempted": true,
          "auto_advance": false,
          "billing_reason": "subscription_cycle",
          "charge": null,
          "collection_method": "charge_automatically",
          "created": 1576684299,
          "currency": "usd",
          "custom_fields": null,
          "customer": "cus_GLBNvU7Y4CEL02",
          "customer_address": {
              "city": "Amsterdam",
              "country": "Netherlands",
              "line1": "Orteliusstraat 217-2",
              "line2": "",
              "postal_code": "1056NR",
              "state": "Noord-Holland"
          },
          "customer_email": "info@playpost.app",
          "customer_name": "Playpost Demo",
          "customer_phone": "+31612706744",
          "customer_shipping": {
              "address": {
                  "city": "Amsterdam",
                  "country": "NL",
                  "line1": "Orteliusstraat 217-2",
                  "line2": "",
                  "postal_code": "1056NR",
                  "state": ""
              },
              "name": "Playpost",
              "phone": "+31612706744"
          },
          "customer_tax_exempt": "none",
          "customer_tax_ids": [],
          "default_payment_method": null,
          "default_source": null,
          "default_tax_rates": [
              {
                  "id": "txr_1Fqzv1LbygOvfi9oYJqZckKS",
                  "object": "tax_rate",
                  "active": true,
                  "created": 1576665495,
                  "description": "BTW",
                  "display_name": "VAT",
                  "inclusive": false,
                  "jurisdiction": "NL",
                  "livemode": false,
                  "metadata": {},
                  "percentage": 21
              }
          ],
          "description": null,
          "discount": null,
          "due_date": null,
          "ending_balance": 0,
          "footer": null,
          "hosted_invoice_url": "https://pay.stripe.com/invoice/invst_NSJryKB9DFEzIQQ6KdTLElKBSn",
          "invoice_pdf": "https://pay.stripe.com/invoice/invst_NSJryKB9DFEzIQQ6KdTLElKBSn/pdf",
          "lines": {
              "object": "list",
              "data": [
                  {
                      "id": "il_1Fr4oJLbygOvfi9oYjr0kNpf",
                      "object": "line_item",
                      "amount": 0,
                      "currency": "usd",
                      "description": "5783 character × Basic (Free trial)",
                      "discountable": true,
                      "livemode": false,
                      "metadata": {},
                      "period": {
                          "end": 1576683999,
                          "start": 1576565653
                      },
                      "plan": {
                          "id": "plan_GLVHSLbMkT1UX8",
                          "object": "plan",
                          "active": false,
                          "aggregate_usage": "sum",
                          "amount": null,
                          "amount_decimal": null,
                          "billing_scheme": "tiered",
                          "created": 1576144092,
                          "currency": "usd",
                          "interval": "month",
                          "interval_count": 1,
                          "livemode": false,
                          "metadata": {},
                          "nickname": "Monthly plan",
                          "product": "prod_GLVB5oHF6RfalZ",
                          "tiers": [
                              {
                                  "flat_amount": 999,
                                  "flat_amount_decimal": "999",
                                  "unit_amount": 0,
                                  "unit_amount_decimal": "0",
                                  "up_to": 100000
                              },
                              {
                                  "flat_amount": null,
                                  "flat_amount_decimal": null,
                                  "unit_amount": null,
                                  "unit_amount_decimal": "0.016",
                                  "up_to": null
                              }
                          ],
                          "tiers_mode": "graduated",
                          "transform_usage": null,
                          "trial_period_days": 1,
                          "usage_type": "metered"
                      },
                      "proration": false,
                      "quantity": 5783,
                      "subscription": "sub_GNKb05bvWL9vsy",
                      "subscription_item": "si_GNKbK8bT1KAa6A",
                      "tax_amounts": [
                          {
                              "amount": 0,
                              "inclusive": false,
                              "tax_rate": "txr_1Fqzv1LbygOvfi9oYJqZckKS"
                          }
                      ],
                      "tax_rates": [],
                      "type": "subscription"
                  }
              ],
              "has_more": false,
              "total_count": 1,
              "url": "/v1/invoices/in_1Fr4oJLbygOvfi9ozEcWIYnZ/lines"
          },
          "livemode": false,
          "metadata": {},
          "next_payment_attempt": null,
          "number": "BAA92057-0002",
          "paid": true,
          "payment_intent": null,
          "period_end": 1576684299,
          "period_start": 1576565653,
          "post_payment_credit_notes_amount": 0,
          "pre_payment_credit_notes_amount": 0,
          "receipt_number": null,
          "starting_balance": 0,
          "statement_descriptor": null,
          "status": "paid",
          "status_transitions": {
              "finalized_at": 1576726081,
              "marked_uncollectible_at": null,
              "paid_at": 1576726081,
              "voided_at": null
          },
          "subscription": "sub_GNKb05bvWL9vsy",
          "subtotal": 0,
          "tax": 0,
          "tax_percent": 21,
          "total": 0,
          "total_tax_amounts": [
              {
                  "amount": 0,
                  "inclusive": false,
                  "tax_rate": "txr_1Fqzv1LbygOvfi9oYJqZckKS"
              }
          ],
          "webhooks_delivered_at": 1576684300
      },
      "livemode": false,
      "metadata": {},
      "next_pending_invoice_item_invoice": null,
      "pending_invoice_item_interval": null,
      "pending_setup_intent": null,
      "pending_update": null,
      "plan": {
          "id": "plan_GLVHSLbMkT1UX8",
          "object": "plan",
          "active": false,
          "aggregate_usage": "sum",
          "amount": null,
          "amount_decimal": null,
          "billing_scheme": "tiered",
          "created": 1576144092,
          "currency": "usd",
          "interval": "month",
          "interval_count": 1,
          "livemode": false,
          "metadata": {},
          "nickname": "Monthly plan",
          "product": {
              "id": "prod_GLVB5oHF6RfalZ",
              "object": "product",
              "deleted": true
          },
          "tiers": [
              {
                  "flat_amount": 999,
                  "flat_amount_decimal": "999",
                  "unit_amount": 0,
                  "unit_amount_decimal": "0",
                  "up_to": 100000
              },
              {
                  "flat_amount": null,
                  "flat_amount_decimal": null,
                  "unit_amount": null,
                  "unit_amount_decimal": "0.016",
                  "up_to": null
              }
          ],
          "tiers_mode": "graduated",
          "transform_usage": null,
          "trial_period_days": 1,
          "usage_type": "metered"
      },
      "quantity": 1,
      "schedule": null,
      "start_date": 1576565653,
      "status": "canceled",
      "tax_percent": 21,
      "trial_end": 1577170453,
      "trial_start": 1576565653
  }
]
