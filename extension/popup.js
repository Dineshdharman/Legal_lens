document.getElementById("analyzeBtn").addEventListener("click", async () => {
  const loading = document.getElementById("loading");
  const results = document.getElementById("results");
  const btn = document.getElementById("analyzeBtn");

  // Reset UI
  loading.style.display = "block";
  results.style.display = "none";
  btn.disabled = true;

  try {
    // 1. Get Active Tab
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // 2. Get Text from Page
    const injectionResults = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => document.body.innerText,
    });

    if (!injectionResults || !injectionResults[0]) {
      throw new Error("Could not read page. Try refreshing the tab.");
    }

    const pageText = injectionResults[0].result;

    // 3. Send to Backend
    const response = await fetch("http://127.0.0.1:8000/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: tab.url, text: pageText }),
    });

    if (!response.ok) throw new Error("Server error. Is python running?");

    const rawData = await response.json();
    // Parse if it's a string (Gemini SDK quirk), otherwise use object
    const aiData = typeof rawData === "string" ? JSON.parse(rawData) : rawData;

    // 4. Update UI & COLORS
    loading.style.display = "none";
    results.style.display = "block";

    // --- COLOR LOGIC HERE ---
    const scoreSpan = document.getElementById("score");
    const score = aiData.safety_score;

    scoreSpan.innerText = score;
    scoreSpan.style.fontWeight = "900"; // Make it Extra Bold
    scoreSpan.style.fontSize = "32px"; // Make it Big

    if (score >= 8) {
      scoreSpan.style.color = "#16a34a"; // Green
    } else if (score >= 5) {
      scoreSpan.style.color = "#ea580c"; // Orange
    } else {
      scoreSpan.style.color = "#dc2626"; // Red
    }
    // ------------------------

    document.getElementById("summary").innerText = aiData.summary;

    const flagsList = document.getElementById("flags");
    flagsList.innerHTML = "";

    if (aiData.red_flags && aiData.red_flags.length > 0) {
      aiData.red_flags.forEach((flag) => {
        const li = document.createElement("li");
        li.innerText = flag;
        flagsList.appendChild(li);
      });
    } else {
      flagsList.innerHTML =
        "<li style='color:green; border-left-color:green; background:#f0fdf4'>No red flags detected!</li>";
    }
  } catch (err) {
    console.error(err);
    loading.innerText = "Error: " + err.message;
    loading.style.color = "red";
  } finally {
    btn.disabled = false;
  }
});
