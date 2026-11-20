# Healing events

Events are managed on the website, no code needed:
1. Log in with an admin account and open /admin/ → "Healing events".
2. "+ New event": name, India date/time, format, venue, price per seat (0 = free), total seats, description,
   highlights, cover photo. Tick "Published" to show it on the site. "Duplicate" copies an event for repeats.
3. "Bookings" tab: confirmed seats, online revenue, attendee list with WhatsApp links, CSV download,
   "+ Add booking" for cash/UPI payments, cancel/restore.

Visitors book on /event/<web-address>/ with name, email, WhatsApp number and seats.
Free events confirm instantly; paid events use Razorpay checkout (needs the Razorpay keys in Vercel).
Events move to "Past events" automatically when they end.
Database setup: _src/supabase/events.sql (run once, after schema.sql).
