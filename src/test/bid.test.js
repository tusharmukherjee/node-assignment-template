"use strict";

const assert = require("node:assert/strict");
const { after, before, beforeEach, test } = require("node:test");
const { getSequelize } = require("../db/sequelize");
const { Auction, Bid } = require("../models");
const { placeBid } = require("../controllers/bid");

const AUCTION_ID = "11111111-1111-1111-1111-111111111111";
const MISSING_AUCTION_ID = "99999999-9999-9999-9999-999999999999";
const USER_ONE = "22222222-2222-2222-2222-222222222222";
const USER_TWO = "33333333-3333-3333-3333-333333333333";

const sequelize = getSequelize();

async function resetAuction(overrides = {}) {
  await Bid.destroy({ where: {} });
  await Auction.upsert({
    id: AUCTION_ID,
    startsAt: new Date(Date.now() - 60 * 60 * 1000),
    endsAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    currentTopBidAmount: null,
    currentTopBidUserId: null,
    currentTopBidId: null,
    ...overrides
  });
}

before(async () => {
  await sequelize.authenticate();
});

beforeEach(async () => {
  await resetAuction();
});

after(async () => {
  await sequelize.close();
});

test("rejects missing or invalid bid input", async () => {
  const result = await placeBid(AUCTION_ID, USER_ONE, 0);

  assert.equal(result.status, 400);
  assert.equal(result.body.error, "auction_id, user_id and valid amount are required");
});

test("returns 404 when the auction does not exist", async () => {
  const result = await placeBid(MISSING_AUCTION_ID, USER_ONE, 100);

  assert.equal(result.status, 404);
  assert.equal(result.body.error, "Auction not found");
});

test("rejects a bid after the auction has closed", async () => {
  await resetAuction({ endsAt: new Date(Date.now() - 1000) });

  const result = await placeBid(AUCTION_ID, USER_ONE, 100);

  assert.equal(result.status, 409);
  assert.equal(result.body.error, "Auction is closed");
});

test("returns the original bid when the same bid is retried", async () => {
  const first = await placeBid(AUCTION_ID, USER_ONE, 100);
  const retry = await placeBid(AUCTION_ID, USER_ONE, 100);

  assert.equal(first.status, 201);
  assert.equal(retry.status, 200);
  assert.equal(retry.body.message, "Bid already processed");
  assert.equal(retry.body.bid.id, first.body.bid.id);
  assert.equal(await Bid.count(), 1);
});

test("rejects another bid from the current highest bidder", async () => {
  await resetAuction({
    currentTopBidAmount: 100,
    currentTopBidUserId: USER_ONE
  });

  const result = await placeBid(AUCTION_ID, USER_ONE, 200);

  assert.equal(result.status, 409);
  assert.equal(result.body.error, "You are already the highest bidder");
});

test("rejects a bid that does not exceed the current top bid", async () => {
  await resetAuction({
    currentTopBidAmount: 100,
    currentTopBidUserId: USER_TWO
  });

  const result = await placeBid(AUCTION_ID, USER_ONE, 100);

  assert.equal(result.status, 409);
  assert.equal(result.body.error, "Bid must be higher than current top bid");
  assert.equal(Number(result.body.current_top_bid), 100);
});

test("atomically creates an accepted bid and updates the auction", async () => {
  const result = await placeBid(AUCTION_ID, USER_ONE, 100);
  const auction = await Auction.findByPk(AUCTION_ID);

  assert.equal(result.status, 201);
  assert.equal(result.body.message, "Bid accepted");
  assert.equal(Number(auction.currentTopBidAmount), 100);
  assert.equal(auction.currentTopBidUserId, USER_ONE);
  assert.equal(auction.currentTopBidId, result.body.bid.id);
  assert.equal(await Bid.count(), 1);
});

test("rolls back bid creation if updating the auction fails", async () => {
  Auction.addHook("beforeUpdate", "force-auction-update-failure", () => {
    throw new Error("forced auction update failure");
  });

  const originalConsoleError = console.error;
  console.error = () => {};

  try {
    const result = await placeBid(AUCTION_ID, USER_ONE, 100);

    assert.equal(result.status, 500);
    assert.equal(await Bid.count(), 0);
  } finally {
    console.error = originalConsoleError;
    Auction.removeHook("beforeUpdate", "force-auction-update-failure");
  }
});
