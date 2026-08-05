# Deploying this site

Everything needed to put a new version of elique-events.com online, and the
mistakes that are worth not repeating.

---

## Where things live

| | |
|---|---|
| **Control panel** | https://customer.zonnet.nl |
| **Package** | "Hosting E-mail Only L" — Shared Hosting Linux (Apache) |
| **Web server** | `web232.hostingdiscounter.nl` |
| **Mail server** | `mail227.hostingdiscounter.nl` |
| **Bound to** | www.elique-events.com |
| **Contract** | since 06-10-2024, renews 06-10-2026, €90/yr excl. VAT |

Domains and certificate, all under the same account:

- `elique-events.com` — the live site
- `elique-events.nl` — registered, currently only a WWW pointer
- SSL Basic DV, issued for `www.elique-events.com`

### The one limit that matters

| Resource | Allowance |
|---|---|
| **Website space** | **10 MB** |
| E-mail space | 5.000 MB |
| Traffic | 25.000 MB / month |

Ten megabytes. That is the whole budget for the site.

Before the 2026 rebuild the site was **160,52 MB — 1605% over quota**, because
the original assets were uncompressed PNGs and full-resolution video. The
current site is **5,8 MB**, so there is roughly 4 MB of headroom.

Anything added later has to fit in that. Convert images to AVIF with a WebP
fallback (see `README.md`) rather than dropping in PNGs or JPEGs, and check
the usage figure in the control panel after every deploy.

Despite the package being called "E-mail Only", it does include this web
space and FTP access. Do not go looking for a separate hosting subscription —
there isn't one.

---

## Connecting with FileZilla

Once, when setting up a new machine.

**Credentials** come from the control panel: open the hosting subscription and
click **FTP accounts beheren**. Create an account there if none exists.

**Settings:**

| Field | Value |
|---|---|
| Host | `web232.hostingdiscounter.nl` |
| Port | 21 |
| Protocol | FTP with explicit TLS (FileZilla negotiates this automatically) |
| User | from the control panel |

**On first connect you get an "Unknown certificate" warning.** This is normal —
FileZilla does not use the Windows certificate store and asks once per server.
Before accepting, check that:

- Subject is `*.hostingdiscounter.nl` (the wildcard covers `web232.…`)
- Issuer is a real CA — currently Sectigo
- The validity period covers today

Tick both boxes and accept. The dialog itself is a good sign: it means the
connection is TLS-encrypted rather than plain FTP with a cleartext password.

If this warning ever reappears unprompted, or the subject is no longer
`hostingdiscounter.nl`, stop and investigate.

**Turn on hidden files:** `Server → Force showing hidden files`. Without it
`.htaccess` is invisible and you will not notice it is missing.

---

## The server layout

```
/                    ← you land here; NOT the web root
├── logs/            server access logs, do not touch
├── tmp/             scratch, do not touch
├── .htpasswd        credentials file, do not touch
└── www/             ← THE WEB ROOT — the site goes in here
    └── cgi-bin/     empty, server-managed, leave it alone
```

Uploading into `/` instead of `/www/` does nothing visible and leaves a mess.

---

## Deploying

### 1. Commit first

Deploy from a clean working tree, so that whatever goes live matches a commit
you can return to.

```powershell
cd C:\Git\Elique-Events
git status          # should be empty
```

### 2. Back up what is live — outside the repo

```
Desktop\Elique\server-backup-<date>\
```

Download the full contents of `/www/` there. **Not into `C:\Git\Elique-Events`** —
see the pitfalls below for why.

### 3. Empty `/www/`

Delete everything in it. If `cgi-bin` refuses to go, leave it; it is empty and
managed by the server.

Overwriting instead of emptying is the mistake that kept the site at 1605% of
quota for two years: old asset folders stay behind and keep counting.

### 4. Upload

From `C:\Git\Elique-Events`, into `/www/`:

| Upload | Skip |
|---|---|
| `.htaccess` | `.git/` |
| `404.html` | `_to_delete/` |
| `index.html` | `.gitignore` |
| `index.js` | `.gitattributes` |
| `robots.txt` | `README.md` |
| `site.webmanifest` | `DEPLOY.md` |
| `sitemap.xml` | |
| `style.css` | |
| `assets/` (folder) | |
| `services/` (folder) | |

Roughly 73 files, 5,8 MB.

**Check that `.htaccess` actually arrived.** It is a dotfile; if hidden files
are not shown it is easy to miss, and everything in it fails silently —
no redirect, no compression, no caching, no custom 404.

The `services/` subfolders must keep their structure. `services/<name>/index.html`
is what makes `/services/<name>/` resolve.

### 5. Verify

- [ ] https://elique-events.com — new version loads
- [ ] https://www.elique-events.com — **redirects** to the version without www
- [ ] https://elique-events.com/services/corporate-meetings-and-events/ — loads
- [ ] A nonsense URL shows the styled 404, not Apache's default
- [ ] Control panel: website space back under 100%
- [ ] Contact form sends and shows the inline confirmation

### 6. Rolling back

Upload the contents of the backup folder from step 2 over `/www/`. There is no
staging environment and no deploy history on the server — that backup is the
only way back.

---

## Pitfalls we actually hit

**Backing up into the git repository.** The `/www/` download went into
`C:\Git\Elique-Events`, which dropped 161 MB of old site plus `logs/` and the
server's `.htpasswd` into the working tree. Nothing was committed, but a
`git add -A` would have put credentials into history. Always back up to a
folder outside the repo.

**Files disappearing mid-transfer.** During that same session the entire
`services/` folder vanished from the working tree. It was recoverable with
`git checkout -- services` because it had been committed. Commit before you
deploy; it is the difference between an inconvenience and rewriting four pages.

**FileZilla caches directory listings.** After changing files outside FileZilla
the panes still show the old state. Press **F5** before concluding something
went wrong.

**Dotfiles are hidden on both sides.** `.htaccess` is the one that matters.

**Git locks.** Unrelated to FileZilla, but it bit us repeatedly: if a git
command is interrupted it can leave `.git/index.lock` or `.git/packed-refs.lock`
behind, and every later command then refuses with "Another git process seems to
be running". If no git process is actually running, delete the lock:

```powershell
Remove-Item C:\Git\Elique-Events\.git\index.lock
Remove-Item C:\Git\Elique-Events\.git\packed-refs.lock
```

---

## What `.htaccess` does

Kept in the repo so it is versioned with everything else. In summary:

- Forces HTTPS, and redirects `www` to the version without it, in one hop.
  Both hostnames used to serve the site independently, which splits ranking
  value between two identical sites.
- Serves `404.html` for missing pages.
- Declares the AVIF and WebP MIME types. Older Apache builds do not know
  them, and every image here is AVIF with a WebP fallback.
- gzip and Brotli on text; nothing on images or video, which are already
  compressed.
- Caching: HTML always revalidated, CSS and JS a day, media a month. Filenames
  are not content-hashed, so a long cache on HTML or CSS would leave returning
  visitors on a stale version after a deploy.
- A few security headers, and blocks direct access to dotfiles and `.md`.

Every block is wrapped in `<IfModule>`, so a module the server does not have is
skipped rather than throwing a 500.

**If the site returns 500 after a deploy**, `.htaccess` is the first suspect.
Rename it to `.htaccess-off` over FTP — the site comes straight back — then
bisect by re-adding blocks.

### Choosing www or no-www

The site currently declares the version **without** `www` as canonical, in the
canonical tags, `sitemap.xml`, the Open Graph URLs and the structured data.
`.htaccess` enforces that.

To switch, both sides have to change: the rewrite rule at the top of
`.htaccess` **and** every URL in `index.html`, `sitemap.xml` and the four
service pages. Changing only one creates a redirect loop or a canonical that
points at a redirect.

---

## After a deploy that changes URLs or content

Google will not notice on its own for days or weeks. Speed it up:

1. Google Search Console — submit `sitemap.xml`, then "Request indexing" for
   the pages that changed
2. Bing Webmaster Tools — same
3. Check that the LinkedIn company page links to the site; that link is a real
   ranking signal and it is free
