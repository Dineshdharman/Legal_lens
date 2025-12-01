console.log("⚖️ LegalLens Content Script Active");

function detectLegalPage() {
  let score = 0;
  const textToCheck = document.body.innerText.substring(0, 5000).toLowerCase(); // Scan top 5000 chars
  const url = window.location.href.toLowerCase();
  const title = document.title.toLowerCase();

  // 1. URL & Title Keywords (Strong Indicators)
  const strongKeywords = [
    "terms",
    "privacy",
    "legal",
    "policy",
    "agreement",
    "tos",
    "eula",
    "conditions",
    "gdpr",
  ];

  if (strongKeywords.some((k) => url.includes(k))) score += 3;
  if (strongKeywords.some((k) => title.includes(k))) score += 4;

  // 2. "Lawyer Speak" in the Content (The "Smoking Gun")
  // These phrases almost NEVER appear on normal pages, only in contracts.
  const phraseTriggers = [
    "effective date",
    "last updated",
    "governed by",
    "jurisdiction",
    "arbitration",
    "class action waiver",
    "intellectual property rights",
    "disclaimer of warranties",
    "limitation of liability",
    "these terms",
    "privacy policy",
    "by accessing",
    "you agree to",
  ];

  phraseTriggers.forEach((phrase) => {
    if (textToCheck.includes(phrase)) {
      score += 2; // Add points for every legal phrase found
    }
  });

  console.log(`⚖️ LegalLens Score: ${score}/10`);

  // THRESHOLD: If score > 5, it's definitely a legal doc
  if (score >= 5) {
    showBadge();
  }
}

function showBadge() {
  // Prevent double badges
  if (document.getElementById("legal-lens-badge")) return;

  const badge = document.createElement("div");
  badge.id = "legal-lens-badge";
  badge.innerHTML = "⚖️ Detected";

  // Styling
  Object.assign(badge.style, {
    position: "fixed",
    bottom: "20px",
    right: "20px",
    backgroundColor: "#ff4444",
    color: "white",
    padding: "10px 15px",
    borderRadius: "30px",
    fontFamily: "sans-serif",
    fontWeight: "bold",
    zIndex: "99999",
    cursor: "pointer",
    boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
    transition: "transform 0.2s",
    fontSize: "14px",
  });

  // Hover effect
  badge.onmouseover = () => (badge.style.transform = "scale(1.05)");
  badge.onmouseout = () => (badge.style.transform = "scale(1)");

  // Click to open extension (Note: Programmatically opening popup is restricted in Chrome)
  // So we just alert the user to click the toolbar icon
  badge.onclick = () => {
    alert(
      "LegalLens detected a contract!\n\n↗️ Please click the LegalLens icon in your browser toolbar to Analyze it."
    );
    badge.style.display = "none";
  };

  document.body.appendChild(badge);
}

// Run detection after page load
// We use a slight delay to ensure dynamic frameworks (React/Angular) have rendered text
setTimeout(detectLegalPage, 1000);
