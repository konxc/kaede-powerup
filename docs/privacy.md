# Privacy Policy

**Last updated: June 27, 2026**

KAEDE (Koneksi Automated Environment & Developer Engineering) is a Trello Power-Up developed by **PT Koneksi Jaringan Indonesia** ("we", "our", "us"). We are committed to protecting your privacy. This policy explains how we handle information when you use our Power-Up.

## Data Storage

KAEDE **does not store any personal data** outside of Trello's infrastructure. All data created through the Power-Up — such as environment labels assigned to cards — is stored exclusively via Trello's built-in **Shared Storage** API. This data resides within Trello's servers and is subject to [Atlassian's Privacy Policy](https://www.atlassian.com/legal/privacy-policy).

## MCP Server

KAEDE includes a local MCP (Model Context Protocol) server that runs entirely on your machine via stdio. It uses Trello API credentials stored in a local configuration file (`~/.config/kaede/secrets.env`). These credentials are:

- Stored only on your local machine, never transmitted to us
- Used solely to authenticate with Trello's API
- Never shared with any third party

The MCP server processes board, list, card, and label data on your behalf — all communication is directly between your machine and Trello's servers via HTTPS.

## Information We Collect

We do **not** collect, transmit, or store:

- Your name, email address, or avatar
- Your Trello username or account information
- Card content, board content, or workspace data
- IP addresses or device identifiers
- Cookies or tracking data
- Your Trello API credentials

The only data processed through the Power-Up is the **environment setting** (production / staging / development) you optionally assign to a card, stored entirely within Trello's systems.

## Third-Party Services

KAEDE relies on the following third-party services:

- **Trello (Atlassian)** — provides the Power-Up platform, iframe sandbox, and shared storage.
- **Netlify** — hosts the Power-Up's static assets (HTML, CSS, JavaScript). Netlify's standard server logs may capture anonymized request data (e.g., requested page, timestamp).

We do not control how these third parties process data. Please review their respective privacy policies for more information.

## Data Sharing

We do **not** sell, trade, or share your personal information with any third party. We do not use analytics services, tracking pixels, or advertising networks.

## Changes to This Policy

We may update this privacy policy from time to time. Changes will be posted on this page with an updated revision date.

## Contact

If you have questions about this policy, please contact us at:

Email: [androxoss@hotmail.com](mailto:androxoss@hotmail.com)
Organization: PT Koneksi Jaringan Indonesia
