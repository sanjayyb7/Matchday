# LocalDerby — context for the presentation

Product name: **LocalDerby**. Repo name: Matchday.

This is context for another agent to build a hackathon deck. Do not include env files, API keys, setup instructions, InsForge, or Mapbox.

Hackathon sponsors we used: **Pioneer**, **Terac**, **Stripe**. Only talk about these three.

---

## What it is

LocalDerby shows fans where the match is being watched, puts them in the same room as people who support the same team, and gives them a coupon so they actually walk into a local pub.

That same incentive is how we help local businesses. Pubs are quiet on nights they should be full. We send them a ready-made crowd — fans who already picked a side and have a reason to show up.

Pubs pay $10 a month to appear on the map and offer that incentive. Terac workers onboard those pubs in person and hand the owner a claim code so the listing can go live.

---

## The problem

Two sides, one gap.

**Fans** do not know where the match is happening. Even when they find a TV, they cannot find people who support the same team. Watching alone is the default.

**Local businesses** do not have enough people coming in. A pub can put a match on and still sit half empty, because the fans who would fill those seats never knew to come.

LocalDerby solves both: show fans where to go, connect them with the same fan base, and give them an incentive (a QR coupon) that pulls them through the door. The pub gets the traffic. The fan gets the night and a deal.

---

## Who uses it

**Fans** open the map, pick a side, chat with their squad, tap a pub, claim a QR coupon.

**Pubs** subscribe, enter a Terac claim code, set the match they screen and a daily coupon limit, then redeem QR codes at the door.

**Terac workers** visit SF pubs, log the visit, and give the owner a unique claim code (like `LD-7K2M9P`).

---

## How the product works

One loop:

1. A Terac worker visits a pub that shows soccer and talks to the owner.
2. They submit the visit. Pioneer turns the messy notes into a draft pub profile.
3. The worker gets a claim code and gives it to the owner.
4. The owner subscribes for $10/month with Stripe (or uses demo promo `J007`).
5. They paste the claim code. The pub appears on the fan map.
6. Fans gather there, chat as a squad, and claim a one-time QR coupon.
7. The pub redeems that coupon at the door.

Fans are free. Pubs pay. Terac workers are how pubs get onboarded in person.

---

## Sponsors we used, and how

Use these as the sponsor slides. Each one is a real part of the product, not a logo dump.

### Pioneer — AI on field notes

Pioneer is not a chatbot in the app. It reads a Terac worker’s visit notes and extracts a structured pub draft: name, address, neighborhood, contact, whether they are interested, which match they screen, and what reward they offered.

When the pub later claims their code, that draft becomes the live listing and the first coupon.

**Say this:** Pioneer turns sidewalk notes into a pub listing.

### Terac — people on the street

Terac is the field workforce. Workers go to SF pubs, pitch LocalDerby, and log the visit. Each visit produces a claim code the owner uses after they subscribe.

Without Terac, every pub would have to sign up from scratch. With Terac, the listing is already drafted and the owner only pays and pastes a code.

**Say this:** Terac is how we get real pubs onto the map in a weekend.

### Stripe — pub payments

Fans do not pay. Pubs subscribe for $10/month through Stripe Checkout. That subscription unlocks the partner dashboard. A hackathon promo code (`J007`) can skip payment for the demo.

**Say this:** Stripe is how pubs pay to get that extra foot traffic.

---

## Sponsor story in one sentence

Terac gets the pub, Pioneer structures the visit, Stripe charges the pub, and the listing shows up for fans.

---

## Suggested deck

1. Title — LocalDerby. Find the match. Find your people.
2. Problem — fans do not know where the match is, and cannot connect with the same fan base. Local pubs do not have enough customers on match night.
3. Solution — show where the match is, put the same fans together, and give users a coupon that brings them into the pub.
4. How it works — the seven-step loop above.
5. Sponsors — one beat each: Pioneer, Terac, Stripe.
6. Demo — fan finds the match and their squad, claims a coupon, walks in. Then a Terac visit and a pub going live.
7. Why it is real — paid pubs, in-person onboarding, one-time QR incentives, daily coupon caps.
8. Next — more SF pubs through Terac, then other cities.

---

## Demo the deck should describe

Show a fan finding a pub, picking a team, and claiming a QR coupon.

Then show a Terac visit, Pioneer turning notes into a draft, the owner subscribing with Stripe, pasting the claim code, and redeeming the coupon.

That closes the loop.

---

## Answers for judges

**Why not Instagram or Google Maps?** Those show a place. They do not tell you where this match is being watched, who else from your team is going, or give you a reason to walk in.

**What is the business?** Fans are free. We give them an incentive to show up. Pubs pay $10/month because that incentive fills seats they would otherwise miss.

**What did we actually build?** A way to find the match, join the same fan base, claim a coupon, and a pub dashboard that redeems it. Terac onboards the businesses in person.

**How did we use the sponsors?** Terac puts humans in SF pubs. Pioneer turns those visit notes into a listing. Stripe is how the pub pays $10/month to go live.
