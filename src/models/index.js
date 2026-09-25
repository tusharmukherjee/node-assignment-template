const { DataTypes } = require("sequelize");
const { getSequelize } = require("../db/sequelize");

const sequelize = getSequelize();

const Auction = sequelize.define(
  "Auction",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },

    startsAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "starts_at"
    },

    endsAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "ends_at"
    },

    currentTopBidAmount: {
      type: DataTypes.BIGINT,
      allowNull: true,
      field: "current_top_bid_amount"
    },

    currentTopBidUserId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "current_top_bid_user_id"
    },

    currentTopBidId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "current_top_bid_id"
    }
  },
  {
    tableName: "auctions",
    underscored: true,
    timestamps: true
  }
);


const Bid = sequelize.define(
  "Bid",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },

    auctionId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "auction_id"
    },

    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "user_id"
    },

    amount: {
      type: DataTypes.BIGINT,
      allowNull: false,
      validate: {
        min: 1
      }
    }
  },
  {
    tableName: "bids",
    underscored: true,
    timestamps: true,
    indexes: [
      {
        fields: ["auction_id"]
      },
      {
        fields: ["user_id"]
      },
      {
        fields: ["auction_id", "amount"]
      }
    ]
  }
);

Auction.hasMany(Bid, {
  foreignKey: "auctionId",
  as: "bids"
});

Bid.belongsTo(Auction, {
  foreignKey: "auctionId",
  as: "auction"
});

module.exports = {
  Auction,
  Bid
};
