"use strict";

const AUCTION_ID = "11111111-1111-1111-1111-111111111111";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();

    await queryInterface.bulkDelete("auctions", { id: AUCTION_ID });
    await queryInterface.bulkInsert("auctions", [
      {
        id: AUCTION_ID,
        starts_at: new Date(now.getTime() - 60 * 60 * 1000),
        ends_at: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        current_top_bid_amount: null,
        current_top_bid_user_id: null,
        current_top_bid_id: null,
        created_at: now,
        updated_at: now
      }
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("auctions", { id: AUCTION_ID });
  }
};
