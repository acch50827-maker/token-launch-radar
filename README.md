# Token Launch Radar

[![make.fun](https://make.fun/badge/token-radar-01.svg)](https://make.fun/bounty/token-radar-01)
[![rank](https://make.fun/badge/token-radar-01/acch50827-maker/token-launch-radar/rank.svg)](https://make.fun/bounty/token-radar-01)
[![reward](https://make.fun/badge/token-radar-01/acch50827-maker/token-launch-radar/reward.svg)](https://make.fun/bounty/token-radar-01)

Built for the [make.fun](https://make.fun) bounty
[Build the best token launch radar](https://make.fun/bounty/token-radar-01).

A radar for the token launches that have not happened yet: it ranks the
pre-token protocols in DefiLlama's snapshot by what a token would be worth if
each protocol's record stayed as it is, and gives every protocol a concrete
farm plan — what to do, what it costs, how long it takes.

## How the value is scored

Every protocol on the board records no token, so there is no market price to
read. The radar scores each one from the snapshot's own figures only:

```
implied value = TVL x 0.30 x growth x age x launch likelihood
```

- **TVL x 0.30** — a token's implied value is taken as roughly a third of the
  value the protocol already secures.
- **Growth** — 1 plus the 7-day TVL change, clamped between 0.5 and 2.5.
  Fast-growing TVL is worth more than shrinking TVL.
- **Age** — 1 plus 3% per year tracked, capped at 4 years. A record that has
  survived a while counts for more.
- **Launch likelihood** — 0.05 for a centralised exchange, a bridge, or a
  wrapped/staked product of a token that already trades; 0.3 for a versioned
  build (V2, 2.0); 1 for everything else. Those are not launches waiting to
  happen.

The board holds 200 rows: the 40-protocol watchlist (pre-token, $50M+ TVL)
plus the 160 pre-token protocols below the floor with the most TVL. Implied
value is this radar's own claim, never a prediction that a token will be
issued, or when.

## Run it

Node 22+, standard library only, no network. The program reads the sealed
snapshot and writes the board, the dashboard's data, the dashboard, the
screenshots and the judge's dossier:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts --input /path/to/snapshot.json
```

That writes `out/board.json`, `out/data.js`, `out/dashboard/`,
`out/screenshots/` and `out/dossier.json`. Two runs on the same snapshot
write byte-identical files.

## Layout

- `main.ts` — the program: the value model, the farm plans, the outputs.
- `dashboard/` — the page: board, detail view per protocol, filter
  (chain / category / search) and sortable columns. No network: it reads only
  the `data.js` written beside it.
- `screenshots/` — the board, a protocol's detail view, and a filtered view.
- `vendor/makefun-board.ts` — the house dossier library, copied byte for
  byte from the kit.

---

Built with [make.fun](https://make.fun) — join with my referral link:
https://make.fun/r/xzdd07z5

