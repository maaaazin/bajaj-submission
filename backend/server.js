const express = require("express");
const cors = require("cors");
const processGraph = require("./graphprocessor");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "express server works" });
});

app.post("/api/graph", (req, res) => {
  try {
    const result = processGraph(req.body.edges || []);

    res.json({
      user_id: "maazin_20050104",
      email_id: "maazin.kazi.btech2023@sitpune.edu.in",
      enrollment_number: "23070122126",
      ...result,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});