# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A static HTML/CSS website displaying a weekly triathlon/half-marathon training plan. No build tools, frameworks, or package managers — just two files served directly by a browser.

## Running the Site

Open `index.html` directly in a browser, or use any static file server:

```bash
python3 -m http.server 8000
# or
npx serve .
```

## Architecture

The entire site lives in two files:

- **`index.html`** — All markup and the 14-line inline JavaScript (IntersectionObserver for scroll-reveal animations)
- **`styles.css`** — All styling, organized with comments into sections: CSS custom properties → reset/base → layout → typography → components → animations → responsive breakpoints

**CSS custom properties** (defined in `:root`) control the color palette, typography scale, spacing, and transitions — prefer editing these over hardcoding values elsewhere.

**Responsive breakpoints:** 900px (3-col → 2-col grid) and 600px (2-col → 1-col grid).

**Scroll animations:** Elements with `.reveal-on-scroll` animate in via the IntersectionObserver in `index.html`. Staggered delays are applied via inline `style="transition-delay: Xs"` on individual cards.
