# End-to-end sync tests

Opens the **real** management app and the **real** website in Chromium, points both at a strict
fake Supabase (`fakesb.js`) that enforces the live database's rules — columns and types, NOT NULL,
unique names, identity columns, foreign keys, row-level security, the BEFORE triggers and the RPCs —
then runs each core flow the way staff and customers do and checks both the database rows and what
the other side shows.

    cd tests/e2e && npm ci
    node run.js                  # all tests (WEBSITE_DIR defaults to ../incenso-website)
    node run.js gift bookings    # only tests whose name matches
    VERBOSE=1 node run.js        # print the writes behind a failure

`CAPTURE=writes.json node run.js` records every write; `node replay.js writes.json` turns them into
one SQL statement that replays them against the live database as the same users inside a
transaction that is always rolled back, and reports any difference.
