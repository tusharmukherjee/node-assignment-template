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
    // Creating the bid and updating the auction happen atomically, using sequalze.transactions
    const result = await sequelize.transaction(async (transaction) => {
      // Lock this auction row until the transaction finishes.
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

      // Here checking the closing time if the bid is placed exactly or before the ending time
      if (now >= auction.endsAt) {
        return {
          status: 409,
          body: {
            error: "Auction is closed"
          }
        };
      }

      // Treat an identical auction/user/amount, checking if the user made a retry or mistaken twice api calls somehow.
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

      // Checking the current high bid made from the same user or not
      if (auction.currentTopBidUserId === user_id) {
        return {
          status: 409,
          body: {
            error: "You are already the highest bidder"
          }
        };
      }

      // Equality is rejected: only a strictly greater amount is applicable
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

      // Appending a new bid in bid table at last, after passing all the checks
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

      // After passing the all condition updating the auction row, with new high bid for the auction_id
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
