# Incenso Studio — WhatsApp messages

One message per event. Variables in `{braces}`. Deadlines always state the exact cut-off, never "within 24 hours".

Every message ends with a one-line footer that fits the moment (listed per message as `↳`), always pointing to the account and the studio's WhatsApp: **www.incensostudio.com** (sign in with this number) and **+961 71 930 290**. The sign-in code (1) has no footer.

## Account
1. **Sign-in code** — `Your Incenso code is {code}. It expires in 10 minutes.`
1a. **Account created** (first sign-in only) — `Welcome to Incenso, {name}. This number is your account — bookings, orders and gift balance live here: {accountLink}`  
   ↳ Anything you book or buy shows up at www.incensostudio.com — questions, WhatsApp +961 71 930 290.
1b. **Newsletter subscribed** (footer form; skipped if already subscribed) — `You're on the list — new services, quiet offers and studio news, only when there's something worth saying. Reply STOP any time.`  
   ↳ Manage this at www.incensostudio.com › Account, or WhatsApp +961 71 930 290.

## Orders
2. **Placed · card or fully covered by gift balance** — `Order {ref} confirmed and paid ({total}{gift: ", {gift} from your gift balance" | ""}). {pickup: "Ready to collect at the studio from {nextOpening} — bring your order number." | delivery: "We're preparing it now and will message you when it's with the courier."}`  
   ↳ Track it or see the receipt at www.incensostudio.com › Account › Orders, or WhatsApp +961 71 930 290.
3. **Placed · Whish / OMT** — `Order {ref} reserved ({total}{gift: ", {gift} from your gift balance" | ""}). Send {toPay} via {method} to +961 71 930 290 with "{ref}" in the note by {deadline}. We confirm the moment it lands; unpaid orders are released after that time.`  
   ↳ Order details at www.incensostudio.com › Account › Orders. Sent it already? WhatsApp +961 71 930 290.
4. **Payment reminder · Whish / OMT** (12 h before deadline, if unpaid) — `A reminder: {total} via {method} for order {ref} is due by {deadline}. After that the order is released.`  
   ↳ Already paid? WhatsApp +961 71 930 290 with your order number. Details at www.incensostudio.com › Account.
5. **Payment confirmed · Whish / OMT** — `Got it — {total} received for order {ref}. {pickup: "Ready to collect at the studio from {nextOpening}." | delivery: "We're preparing it now and will message you when it's with the courier."}`  
   ↳ Receipt and status at www.incensostudio.com › Account › Orders, or WhatsApp +961 71 930 290.
6. **Cancelled · payment not received** — `Order {ref} was released — we didn't receive the {method} transfer by {deadline}. Nothing was charged. Order again any time.`  
   ↳ Reorder at www.incensostudio.com — questions, WhatsApp +961 71 930 290.
7. **Placed · cash at studio** — `Order {ref} reserved ({total}{gift: ", {gift} from your gift balance" | ""}). Ready to collect at the studio from {nextOpening} — pay when you pick it up. We hold it until {holdDeadline}.`  
   ↳ Track it at www.incensostudio.com › Account › Orders. Can't make it in time? WhatsApp +961 71 930 290.
8. **Pickup reminder · cash** (1 day before hold ends) — `A reminder: order {ref} is waiting for you at the studio until {holdDeadline}. After that it's released.`  
   ↳ Need a day more? WhatsApp +961 71 930 290. Details at www.incensostudio.com › Account.
9. **Cancelled · not collected** — `Order {ref} was released — it wasn't collected by {holdDeadline}. Nothing was charged.`  
   ↳ Reorder at www.incensostudio.com — questions, WhatsApp +961 71 930 290.
10. **Placed · cash on delivery** — `Order {ref} confirmed ({total}, cash on delivery). We're preparing it now and will message you when it's with the courier.`  
   ↳ Track it at www.incensostudio.com › Account › Orders, or WhatsApp +961 71 930 290.
11. **With courier** (admin enters courier details when moving the status; company, phone and ETA are required, the rest sent if present) — `Order {ref} is with {courierCompany}{driver: " ({driver})" | ""} — expected {eta}. Courier: {courierPhone}{tracking: " · tracking {tracking}" | ""}{trackingUrl: " {trackingUrl}" | ""}. {cod: "Have {total} ready in cash." | prepaid: "Nothing more to pay."}`  
   ↳ Not home? Reply here or WhatsApp +961 71 930 290. Order details at www.incensostudio.com › Account.
12. **Delivered** — `Order {ref} delivered. Thank you — see you at the studio.`  
   ↳ Your receipt is at www.incensostudio.com › Account › Orders. Anything wrong with it? WhatsApp +961 71 930 290.
13. **Collected** — `Order {ref} collected. Thank you — see you soon.`  
   ↳ Your receipt is at www.incensostudio.com › Account › Orders. Anything wrong with it? WhatsApp +961 71 930 290.
14. **Partially cancelled** — `One change to order {ref}: {item} was removed. New total {newTotal}. {prepaid: "We'll refund the {difference} difference the same way you paid — you'll get a message when it's sent." | unpaid: "You only pay for what you receive."}`  
   ↳ Why, and the updated order: www.incensostudio.com › Account › Orders. Prefer to cancel the rest? WhatsApp +961 71 930 290.
15. **Cancelled by studio** — `We had to cancel order {ref}. {prepaid: "We'll refund {total} in full the same way you paid — you'll get a message when it's sent." | unpaid: "Nothing was charged."} Sorry about that.`  
   ↳ Why, and refund details: www.incensostudio.com › Account › Orders — or WhatsApp +961 71 930 290.
16. **Refund sent** (any prepaid method, when the refund is actually sent) — `{amount} refund sent for {ref} via {method}. {card: "It reaches your card within 3–5 business days." | transfer: "It should show in your {method} wallet shortly." | gift: "It's back on your gift balance now."}`  
   ↳ Receipt at www.incensostudio.com › Account. Not arrived after 5 days? WhatsApp +961 71 930 290.
17. **Back in stock** — `{item} is back on the shelf. You asked us to tell you: {shopLink}`  
   ↳ Or WhatsApp +961 71 930 290 and we'll set one aside.

## Bookings
18. **Booked · pay at studio or card** — `Booking {ref} confirmed: {services} with {staff}, {date} at {time}. {card: "Paid {paid}{variable: " — any difference against the final price agreed in the chair is settled at the studio" | " — nothing to settle at the studio"}." | studio: "Pay at the studio after your appointment." | gift: "{gift} covered by your gift balance{due > 0: ", {due} at the studio" | ""}."} Need to change it? {bookingLink}`  
   ↳ Change or cancel any time at www.incensostudio.com › Account › Bookings, or WhatsApp +961 71 930 290.
18a. **Booked · custom quote** (extensions etc.; replaces 18 when any service has no fixed price) — `Booking {ref} confirmed: {services} with {staff}, {date} at {time}. {quoteItems} is priced by length and thickness — you'll get the exact quote in the chair before we start{fixedPart > 0: "; the rest ({fixedPart}) is {paid: "already paid" | "paid at the studio"}" | ""}.`  
   ↳ Change or cancel any time at www.incensostudio.com › Account › Bookings, or WhatsApp +961 71 930 290.
18b. **Booked · "from" price** — no separate message; 18 sends with `from {price}` and the line `Final price confirmed in the chair.`
18c. **Booked · gift balance + Whish / OMT remainder** — the gift already secures the slot, so this is a confirmed booking with a pending top-up, not a hold (no deadline, never released): `Booking {ref} confirmed: {services} with {staff}, {date} at {time}. {gift} covered by your gift balance — send the remaining {remaining} via {method} to +961 71 930 290 with "{ref}" in the note, or settle it at the studio.`  
   ↳ Change or cancel any time at www.incensostudio.com › Account › Bookings, or WhatsApp +961 71 930 290.
19. **Booked · Whish / OMT** (no gift balance involved) — `Booking {ref} is held for you: {services} with {staff}, {date} at {time}. Send {amount} via {method} to +961 71 930 290 with "{ref}" in the note by {deadline} — the slot is released after that.` `{deadline}` is the earlier of 24 h after booking and the appointment time itself — a booking made less than 24 h ahead simply has until the appointment to pay.  
   ↳ Booking details at www.incensostudio.com › Account. Sent it already? WhatsApp +961 71 930 290.
20. **Payment reminder · Whish / OMT** (12 h before deadline if the window allows, otherwise at the halfway point; skipped if paid) — `A reminder: {amount} via {method} for booking {ref} is due by {deadline}. After that the slot is released.`  
   ↳ Already paid? WhatsApp +961 71 930 290 with your booking number. Or switch to pay at the studio at www.incensostudio.com › Account › Bookings.
21. **Payment confirmed · Whish / OMT** — `Got it — {amount} received. Booking {ref} is confirmed: {services} with {staff}, {date} at {time}.`  
   ↳ Change or cancel any time at www.incensostudio.com › Account › Bookings, or WhatsApp +961 71 930 290.
22. **Released · payment not received** — `Booking {ref} was released — we didn't receive the {method} transfer by {deadline}. Nothing was charged. Book again any time: {bookLink}`  
   ↳ Rebook at www.incensostudio.com — questions, WhatsApp +961 71 930 290.
23. **Reminder** (24 h before; skipped when booked less than 24 h ahead) — `See you tomorrow — {services} with {staff}, {date} at {time}. {due > 0: "{due} to settle at the studio." | ""} 32, Dam & Farz, Tripoli. Running late or need to change? Reply here.`  
   ↳ Running late or need to move it? WhatsApp +961 71 930 290, or change it at www.incensostudio.com › Account › Bookings.
24. **Updated by guest** — `Booking {ref} updated: {services} with {staff}, {date} at {time}. {extraCard: "Extra {extra} paid — nothing to settle." | extraTransfer: "Extra {extra} via {method} — send it with \"{ref}\" in the note." | extraCash: "{extra} to settle at the studio." | refund: "We'll refund {refund} the same way you paid — you'll get a message when it's sent." | ""}`  
   ↳ Everything's at www.incensostudio.com › Account › Bookings. Questions, WhatsApp +961 71 930 290.
25. **Rescheduled by studio** (sent after the studio has called and agreed the new time) — `As agreed, booking {ref} is now {date} at {time} with {staff}. See you then — change it any time: {bookingLink}`  
   ↳ Details at www.incensostudio.com › Account › Bookings — anything else, WhatsApp +961 71 930 290.
26. **Cancelled by guest** — `Booking {ref} cancelled. {refund: "We'll refund {refund} the same way you paid — you'll get a message when it's sent." | gift: "{gift} is back on your gift balance." | ""} Hope to see you again soon.`  
   ↳ Book again at www.incensostudio.com — questions about the refund, WhatsApp +961 71 930 290.
27. **Cancelled by studio** — `We're sorry — we had to cancel booking {ref}. {refund: "We'll refund {refund} in full the same way you paid — you'll get a message when it's sent." | ""}{gift: " {gift} is back on your gift balance." | ""} Rebook any time: {bookLink}`  
   ↳ Why, and refund details: www.incensostudio.com › Account › Bookings. Rebook there, or WhatsApp +961 71 930 290.
27a. **No-show** (receptionist marks it) — `We missed you today for booking {ref} — it's been cancelled, nothing is charged. {prepaid: "We'll refund {paid} the same way you paid — you'll get a message when it's sent." | ""} Book again when you're ready: {bookLink}`  
   ↳ Rebook at www.incensostudio.com, or WhatsApp +961 71 930 290.
27b. **Refund sent** (bookings) — same as 16, with the booking ref.  
   ↳ Receipt at www.incensostudio.com › Account. Not arrived after 5 days? WhatsApp +961 71 930 290.
28. **Visit settled** (receptionist closes the visit) — `Thank you for today. {services} — {total}{paidAhead: " ({paidAhead} paid ahead{balance > 0: ", {balance} settled at the studio" | refund > 0: " — we'll refund {refund} the same way you paid, you'll get a message when it's sent" | ""})" | ""}. {tierUp: "You're now {tier} — {perk} from your next visit." | toNext: "{remaining} more this year to reach {nextTier}."}`  
   ↳ Your receipt and visit history are at www.incensostudio.com › Account. Book your next visit there, or WhatsApp +961 71 930 290.

## Gift cards
29. **Bought · card** (buyer) — `Gift card {code} ({amount}) sent to {recipient} at {recipientPhone}. Receipt: {giftLink}`  
   ↳ Follow it at www.incensostudio.com › Account › Gift cards, or WhatsApp +961 71 930 290.
29a. **Bought for yourself · card** — one message instead of 29 + 30: `{amount} added to your Incenso gift balance (card {code}). Use it on any booking or the shelf — valid to {expiry}.`  
   ↳ Your balance is at www.incensostudio.com › Account › Gift cards, or WhatsApp +961 71 930 290.
29b. **Resent** (buyer taps Resend on the card page) — recipient gets message 30 again; buyer gets `Gift card {code} resent to {recipient} at {recipientPhone}.`  
   ↳ Details at www.incensostudio.com › Account › Gift cards, or WhatsApp +961 71 930 290.
30. **Received** (recipient — sent to their number whether or not they have an account; the account is created the first time they sign in with it) — `{from} sent you a {amount} Incenso gift card{message: ": \"{message}\"" | ""}. It's waiting under this number — sign in at www.incensostudio.com and it's on your balance, ready for any booking. Valid to {expiry}.`  
   ↳ See it at www.incensostudio.com › Account › Gift cards (sign in with this number), or WhatsApp +961 71 930 290.
31. **Bought · Whish / OMT / studio** (buyer) — `Gift card {code} ({amount}) reserved{self: " for you" | " for {recipient}"}. {transfer: "Send {amount} via {method} to +961 71 930 290 with \"{code}\" in the note by {deadline}." | studio: "Pay {amount} at the studio by {deadline}."} It's sent the moment payment is confirmed; after {deadline} the card is cancelled.`  
   ↳ Card details at www.incensostudio.com › Account › Gift cards. Sent it already? WhatsApp +961 71 930 290.
32. **Payment reminder · Whish / OMT / studio** (12 h before a transfer deadline, 1 day before a studio deadline; skipped if paid) — `A reminder: {amount} {transfer: "via {method}" | "at the studio"} for gift card {code} is due by {deadline}. After that the card is cancelled.`  
   ↳ Already paid? WhatsApp +961 71 930 290 with the card code.
33. **Activated** (buyer) — `Payment received — gift card {code} {self: "is on your balance now" | "is on its way to {recipient}"}.` — recipient then gets message 30 (skipped when bought for yourself).  
   ↳ Follow it at www.incensostudio.com › Account › Gift cards, or WhatsApp +961 71 930 290.
34. **Cancelled · payment not received** (buyer) — `Gift card {code} was cancelled — {transfer: "we didn't receive the {method} transfer" | "it wasn't paid at the studio"} by {deadline}. Nothing was charged.`  
   ↳ Buy again at www.incensostudio.com › Gift cards — questions, WhatsApp +961 71 930 290.
35. **Gift balance used** — no message; it shows on the booking / order confirmation as `{gift} from your gift balance` (orders 2 / 3 / 7, bookings 18 / 18c). An order fully covered by gift balance sends message 2. When a booking is cancelled the refund line in 26 / 27 covers the balance coming back.
36. **Expiring soon** (recipient, 30 days out, balance > 0) — `{balance} is still on your Incenso gift card — it's valid until {expiry}. Book a chair: {bookLink}`  
   ↳ Your balance is at www.incensostudio.com › Account › Gift cards, or WhatsApp +961 71 930 290.

## Rules
- Every message (except the sign-in code) ends with a footer pointing to www.incensostudio.com › Account for self-service (bookings, orders, receipts, gift balance, history) and WhatsApp +961 71 930 290 for anything else — worded to the moment, as listed.
- Recipients of gift cards get message 30 at the number the buyer entered, account or not — no account is needed to receive it; signing in with that number later creates the account and attaches the balance.
- Each event sends exactly one message; when a payment confirmation also changes status (ready / preparing / confirmed), it's a single message (5, 21, 33).
- Deadlines: orders — 24 h from placing for Whish / OMT, 3 days from placing for cash pickup; bookings — the earlier of 24 h after booking and the appointment time; gift cards — 24 h from purchase for Whish / OMT, 3 days for pay-at-studio (same as orders). Pickup messages say "from {nextOpening}" so nobody arrives outside opening hours.
- Reasons: messages never state why the studio cancelled or changed something (stock, staff, etc.) — only payment-deadline cancellations name the cause. The reason lives on the order / booking page, and the footer points there.
- Refunds: cancellation messages say "we'll refund"; a separate "refund sent" message (16 / 27b) fires when the money actually moves — for card, Whish, OMT or gift balance alike.
- No-show: the booking is cancelled, nothing is charged, anything prepaid is refunded (Terms §01).
- Variable prices ("from" and custom quotes) never claim "nothing to settle"; the difference against the price agreed in the chair is settled at the studio. Reminders go 12 h (transfers) or 1 day (cash hold) before the cut-off and are skipped if already paid / collected.
- Booking reminder (23) is skipped when the booking was made less than 24 h before the appointment.
- No message for: restock request received or removed, order "preparing" as a separate step, sign-out, profile / photo edits, gift balance spent, switching accounts, cart changes, "from"-price reminders.
- Studio-side actions that trigger messages: confirm transfer (5 / 21 / 33), cancel or partially cancel (14 / 15 / 27), move a booking (25), mark no-show (27a), close the visit (28), mark with courier / delivered / collected (11 / 12 / 13), restock an item (17).
- Spend / level always reflects the settled figure (28), never the estimate. Gift money counts for the buyer when the card is paid, never for the person spending it — so {remaining} / {toNext} in 28 exclude any gift-covered part.
- A booking stays a booking until the desk settles it or it is cancelled; "Settled" is the only completed state.
