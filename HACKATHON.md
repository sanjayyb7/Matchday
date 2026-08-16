# LocalDerby hackathon — partner pubs + Terac field ops

## Product

1. **Pubs subscribe** at [/for-pubs](/for-pubs) for **$10/month** (Stripe Checkout), or use promo **J007**.
2. Subscription unlocks **[/partner](/partner)**. Partner enters the **Terac claim code** to attach their pub.
3. Fans **claim QR coupons** on the pub sheet; pubs redeem tokens in the partner dashboard.
4. **Terac workers** use [/field](/field) to log SF pub visits and receive a unique **claim code** (e.g. `LD-7K2M9P`).
5. **Pioneer** structures visit notes into a draft JSON profile.
6. **Admins** verify visits at [/admin/field-visits](/admin/field-visits) (contact + notes + optional photo — **no GPS**).

## Terac job (post this on Terac)

**Title:** LocalDerby — Call 2 SF soccer pubs + submit 2 field forms

**Pay:** **$25 per completed pub form**  
**Quantity:** **2 jobs** (2 different San Francisco pubs)  
**Budget cap:** **$50 max** total ($25 × 2)

**Direct instructions for the worker:**

1. Call **one** San Francisco pub/restaurant that shows soccer (or sports TV).
2. Speak to the owner or manager. Ask if they want to join **LocalDerby** (fan map + match screening + QR fan coupons, $10/mo).
3. Collect and write down:
   - Pub name, address, neighborhood
   - Contact name, phone, email
   - Interested / not interested / follow up
   - Which matches they’d screen, what fan reward they’d offer, daily coupon limit
4. Open **https://localderby.live/field** and submit **one complete form** for that pub.
5. If they are interested, tell them the **claim code** shown after submit (e.g. `LD-XXXXXX`) and that they should go to **https://localderby.live/for-pubs** to subscribe (or use coupon **J007**), then enter the code on **/partner**.
6. Repeat steps 1–5 for a **second, different** SF pub (second $25 job / second form).

**Done when:** at least **2** forms are submitted for **2** different SF pubs.  
**Do not exceed:** 2 paid completions / **$50**.

## Terac field brief (short)

1. Call SF soccer pubs; collect owner/manager info.
2. Submit each pub at `/field` (need **2 forms** for this campaign).
3. If interested: give them the claim code → `/for-pubs` → `/partner`.
4. Admin verifies at `/admin/field-visits`.


## Promo (skip Stripe)

On `/for-pubs`, enter coupon **`J007`** to unlock `/partner` without paying.

## Env vars

```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_PRICE_ID=                 # $10/mo recurring price
STRIPE_WEBHOOK_SECRET=           # optional but recommended
PIONEER_API_KEY=
TERAC_API_KEY=
INSFORGE_API_KEY=                # admin DB writes
```

Webhook endpoint: `POST /api/stripe/webhook`  
Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
