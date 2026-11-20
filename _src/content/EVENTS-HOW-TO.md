# Adding a healing event

Each event lives in `content/events.json`. Copy an entry and change:

| Field | Example | Notes |
|---|---|---|
| slug | `full-moon-qi-healing-dec-2026` | Becomes the URL: /event/<slug>/ |
| title / subtitle / summary | | Summary shows on cards (1 sentence) |
| start / end | `2026-12-14T18:00` | Local Pune time, 24h |
| mode | `in-person`, `online` or `hybrid` | |
| venue | `Alloha Qi Space, Kalyani Nagar, Pune` or `Zoom (link sent after booking)` | |
| price | `1500` | Rupees per seat. `0` = free |
| seats | `20` | Shown as "Limited to 20 seats". `0` hides it |
| image | Unsplash photo id or leave existing | |
| highlights | list of 3-5 short points | |
| body | Markdown text | |
| razorpay_button_id | `pl_Abc123...` | From Razorpay Payment Button (preferred) |
| razorpay_link | `https://rzp.io/l/...` | Alternative: Razorpay Payment Page link |

Events whose end date has passed move to "Past events" automatically on the next build.
If neither Razorpay field is filled, the page falls back to "Reserve on WhatsApp".

## Razorpay setup (Rikhil, one time)
1. Create a Razorpay account at razorpay.com and complete KYC (PAN, bank account, business details).
2. For each event: Dashboard → Payment Button → Create → "Buy Now" type.
   - Item: event name, price, and set "Stock" to the number of seats.
   - Customer details to collect: Name, Email, Phone, plus "Number of attendees" if needed.
   - After payment: redirect to `https://allohaqispace.com/event-booked/`
3. Copy the Payment Button ID (starts with `pl_`) and send it to Shardul.
4. Bookings and payouts appear in Razorpay → Transactions; customers get an email receipt automatically.
