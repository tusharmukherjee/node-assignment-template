"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("auctions", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      starts_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      ends_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      current_top_bid_amount: {
        type: Sequelize.BIGINT,
        allowNull: true
      },
      current_top_bid_user_id: {
        type: Sequelize.UUID,
        allowNull: true
      },
      current_top_bid_id: {
        type: Sequelize.UUID,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW")
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW")
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("auctions");
  }
};
