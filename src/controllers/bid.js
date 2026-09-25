const { getSequelize } = require("../db/sequelize");
const { Auction, Bid } = require("../models");

async function placeBid(auction_id, user_id, amount) {
  if (!auction_id || !user_id || !amount || amount <= 0) {
    return {
      status: 400,
      body: {
        error: "auction_id, user_id and valid amount are required"
      }
    };
  }

  const sequelize = getSequelize();

  try {
    const result = await sequelize.transaction(async (transaction) => {
      const auction = await Auction.findByPk(auction_id, {
        transaction,
        lock: transaction.LOCK.UPDATE
      });

      if (!auction) {
        return {
          status: 404,
          body: {
            error: "Auction not found"
          }
        };
      }

      const now = new Date();

      if (now >= auction.endsAt) {
        return {
          status: 409,
          body: {
            error: "Auction is closed"
          }
        };
      }

      const existingBid = await Bid.findOne({
        where: {
          auctionId: auction_id,
          userId: user_id,
          amount
        },
        transaction
      });

      if (existingBid) {
        return {
          status: 200,
          body: {
            message: "Bid already processed",
            bid: existingBid
          }
        };
      }

      if (auction.currentTopBidUserId === user_id) {
        return {
          status: 409,
          body: {
            error: "You are already the highest bidder"
          }
        };
      }

      if (
        auction.currentTopBidAmount !== null &&
        Number(amount) <= Number(auction.currentTopBidAmount)
      ) {
        return {
          status: 409,
          body: {
            error: "Bid must be higher than current top bid",
            current_top_bid: auction.currentTopBidAmount
          }
        };
      }

      const bid = await Bid.create(
        {
          auctionId: auction_id,
          userId: user_id,
          amount
        },
        {
          transaction
        }
      );

      await auction.update(
        {
          currentTopBidAmount: amount,
          currentTopBidUserId: user_id,
          currentTopBidId: bid.id
        },
        {
          transaction
        }
      );

      return {
        status: 201,
        body: {
          message: "Bid accepted",
          bid
        }
      };
    });

    return result;
  } catch (error) {
    console.error(error);

    return {
      status: 500,
      body: {
        error: "Internal server error"
      }
    };
  }
}

module.exports = {
  placeBid
};
