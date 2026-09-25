const express = require("express");
const { testConnection } = require("./db/sequelize");
const { placeBid } = require("./controllers/bid");

const app = express();

app.use(express.json());

app.post("/bid", async (req, res) => {
  const { auction_id, user_id, amount } = req.body;

  const result = await placeBid(auction_id, user_id, amount);

  return res.status(result.status).json(result.body);
});

app.use((err, req, res, next) => {
  console.error(err);
  return res.status(500).json({ message: "Internal server error" });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  console.log(`Server listening on port ${PORT}`);
  await testConnection();
});
