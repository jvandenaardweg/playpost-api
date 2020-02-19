export const subscriptionMock =
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
  }
  