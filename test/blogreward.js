const BloggingRewards = artifacts.require("./BlogRewards.sol");
const assertJump = require("./helpers/assertJump");
const log = require("./helpers/logger");

contract("BloggingRewards", accounts => {
	let blog;
	const owner = accounts[0];
	const blogger1 = accounts[1];
	const blogger2 = accounts[2];
	const veto = accounts[3];
	beforeEach(async () => {
		blog = await BloggingRewards.new(owner, 2, 2);
	});
	// ADDING LISTEE

	it("Adding bloggers", async () => {
		await blog.addBlogger(12, { from: blogger1 }).then(tx => {
			log(`Adding blogger ${tx.receipt.gasUsed} gas`);
		});
		await blog.addBlogger(0, { from: blogger2 }).then(tx => {
			log(`Adding blogger ${tx.receipt.gasUsed} gas`);
		});
		const blogger1Result = await blog.getRequestID.call({
			from: blogger1
		});
		assert.equal(blogger1Result, 12);
		const blogger2Result = await blog.getRequestID.call({
			from: blogger2
		});
		assert.equal(blogger2Result, 0);
	});

	// CREATING NEW REWARD REQUEST

	it("Creating a new Reward Request with less value then deposit", async () => {
		try {
			await blog
				.newRewardRequest(1, { from: blogger1, value: 1 })
				.then(tx => {
					log(`Adding new reward request ${tx.receipt.gasUsed} gas`);
				});
			const blogger1Result = await blog.getRequestID.call({
				from: blogger1
			});
			assert.equal(blogger1Result, 1);
			assert.fail("should have thrown before");
		} catch (error) {
			assertJump(error);
		}
	});
	it("Creating a new Reward Request with more value then deposit", async () => {
		await blog
			.newRewardRequest(1, { from: blogger1, value: 3 })
			.then(tx => {
				log(`Adding new reward request ${tx.receipt.gasUsed} gas`);
			});
		const blogger1Result = await blog.getRequestID.call({
			from: blogger1
		});
		assert.equal(blogger1Result, 1);
	});
	it("Creating a new Reward Request with equal value to deposit", async () => {
		await blog
			.newRewardRequest(1, { from: blogger1, value: 2 })
			.then(tx => {
				log(`Adding new reward request ${tx.receipt.gasUsed} gas`);
			});
		const blogger1Result = await blog.getRequestID.call({
			from: blogger1
		});
		assert.equal(blogger1Result, 1);
	});
	it("One blogger applying for more then one request", async () => {
		try {
			await blog
				.newRewardRequest(1, { from: blogger1, value: 2 })
				.then(tx => {
					log(`Adding new reward request ${tx.receipt.gasUsed} gas`);
				});
			await blog
				.newRewardRequest(2, { from: blogger1, value: 2 })
				.then(tx => {
					log(`Adding new reward request ${tx.receipt.gasUsed} gas`);
				});
			assert.fail("should have thrown before");
		} catch (error) {
			assertJump(error);
		}
	});

	// CANCELLING REWARD REQUEST

	it("Blogger trying to cancel reward request without any veto", async () => {
		await blog
			.newRewardRequest(1, { from: blogger1, value: 2 })
			.then(tx => {
				log(`Adding new reward request ${tx.receipt.gasUsed} gas`);
			});
		await blog.cancelRewardRequest({ from: blogger1 }).then(tx => {
			log(`Cancel new reward request ${tx.receipt.gasUsed} gas`);
		});
	});
	it("Blogger trying to cancel reward request without request", async () => {
		try {
			await blog.cancelRewardRequest({ from: blogger1 }).then(tx => {
				log(`Cancel new reward request ${tx.receipt.gasUsed} gas`);
			});
			assert.fail("should have thrown before");
		} catch (error) {
			assertJump(error);
		}
	});
	it("Blogger trying to cancel reward request with veto request", async () => {
		try {
			await blog
				.newRewardRequest(1, { from: blogger1, value: 2 })
				.then(tx => {
					log(`Adding new reward request ${tx.receipt.gasUsed} gas`);
				});
			await blog.vetoRequest(1).then(tx => {
				log(`Veto request ${tx.receipt.gasUsed} gas`);
			});

			await blog.cancelRewardRequest({ from: blogger1 }).then(tx => {
				log(`Cancel new reward request ${tx.receipt.gasUsed} gas`);
			});
			assert.fail("should have thrown before");
		} catch (error) {
			assertJump(error);
		}
	});
	it("Veto on a cancelled request", async () => {
		try {
			await blog
				.newRewardRequest(1, { from: blogger1, value: 2 })
				.then(tx => {
					log(`Adding new reward request ${tx.receipt.gasUsed} gas`);
				});

			await blog.cancelRewardRequest({ from: blogger1 }).then(tx => {
				log(`Cancel new reward request ${tx.receipt.gasUsed} gas`);
			});
			await blog.vetoRequest(1, { from: veto, value: 1 }).then(tx => {
				log(`Veto request ${tx.receipt.gasUsed} gas`);
			});
			assert.fail("should have thrown before");
		} catch (error) {
			assertJump(error);
		}
	});

	// VETO REQUEST

	it("Creating a new Veto request with less value then amount", async () => {
		try {
			await blog
				.newRewardRequest(1, { from: blogger1, value: 1 })
				.then(tx => {
					log(`Adding new reward request ${tx.receipt.gasUsed} gas`);
				});
			await blog.vetoRequest(1, { from: veto, value: 0 }).then(tx => {
				log(`Veto Request ${tx.receipt.gasUsed} gas`);
			});
			assert.fail("should have thrown before");
		} catch (error) {
			assertJump(error);
		}
	});
	it("Creating a new Veto request with more value then amount", async () => {
		await blog
			.newRewardRequest(1, { from: blogger1, value: 2 })
			.then(tx => {
				log(`Adding new reward request ${tx.receipt.gasUsed} gas`);
			});
		await blog.vetoRequest(1, { from: veto, value: 1 }).then(tx => {
			log(`Veto request ${tx.receipt.gasUsed} gas`);
		});
	});
	it("Creating a new Veto request by the blogger itself", async () => {
		try {
			await blog
				.newRewardRequest(1, { from: blogger1, value: 2 })
				.then(tx => {
					log(`Adding new reward request ${tx.receipt.gasUsed} gas`);
				});
			await blog
				.vetoRequest(1, { from: blogger1, value: 1 })
				.then(tx => {
					log(`Veto request ${tx.receipt.gasUsed} gas`);
				});
			assert.fail("should have thrown before");
		} catch (error) {
			assertJump(error);
		}
	});
	it("Creating a new Veto request after 28 days", async () => {
		try {
			await blog
				.newRewardRequest(1, { from: blogger1, value: 2 })
				.then(tx => {
					log(`Adding new reward request ${tx.receipt.gasUsed} gas`);
				});
			await web3.currentProvider.sendAsync(
				{
					jsonrpc: "2.0",
					method: "evm_increaseTime",
					params: [86400 * 29], // 86400 seconds in a day
					id: new Date().getTime()
				},
				() => {}
			);
			await blog.vetoRequest(1, { from: veto, value: 1 }).then(tx => {
				log(`Veto request ${tx.receipt.gasUsed} gas`);
			});
			assert.fail("should have thrown before");
		} catch (error) {
			assertJump(error);
		}
	});
	it("Creating a new Veto request without the blog", async () => {
		try {
			await blog.vetoRequest(1, { from: veto, value: 1 }).then(tx => {
				log(`Veto request ${tx.receipt.gasUsed} gas`);
			});
			assert.fail("should have thrown before");
		} catch (error) {
			assertJump(error);
		}
	});
	it("Trying to veto more then once for the same blog", async () => {
		try {
			await blog
				.newRewardRequest(1, { from: blogger1, value: 2 })
				.then(tx => {
					log(`Adding new reward request ${tx.receipt.gasUsed} gas`);
				});
			await blog.vetoRequest(1, { from: veto, value: 1 }).then(tx => {
				log(`Veto request ${tx.receipt.gasUsed} gas`);
			});
			await blog.vetoRequest(1, { from: veto, value: 1 }).then(tx => {
				log(`Veto request ${tx.receipt.gasUsed} gas`);
			});
			assert.fail("should have thrown before");
		} catch (error) {
			assertJump(error);
		}
	});

	//APPEAL

	it("Creating a new Appeal request with less value then amount", async () => {
		try {
			await blog
				.newRewardRequest(1, { from: blogger1, value: 1 })
				.then(tx => {
					log(`Adding new reward request ${tx.receipt.gasUsed} gas`);
				});
			await blog.vetoRequest(1, { from: veto, value: 1 }).then(tx => {
				log(`Veto request ${tx.receipt.gasUsed} gas`);
			});
			await blog.appeal(1, { from: blogger1, value: 0 }).then(tx => {
				log(`Appeal request ${tx.receipt.gasUsed} gas`);
			});
			assert.fail("should have thrown before");
		} catch (error) {
			assertJump(error);
		}
	});
	it("Creating a new Appeal request with more value then amount", async () => {
		await blog
			.newRewardRequest(1, { from: blogger1, value: 2 })
			.then(tx => {
				log(`Adding new reward request  ${tx.receipt.gasUsed} gas`);
			});
		await blog.vetoRequest(1, { from: veto, value: 1 }).then(tx => {
			log(`Veto request ${tx.receipt.gasUsed} gas`);
		});
		await blog.appeal(1, { from: blogger1, value: 1 }).then(tx => {
			log(`Appeal request  ${tx.receipt.gasUsed} gas`);
		});
	});
	it("Someone else creating a new Appeal request for a blogger ", async () => {
		try {
			await blog
				.newRewardRequest(1, { from: blogger1, value: 2 })
				.then(tx => {
					log(`Adding new reward request ${tx.receipt.gasUsed} gas`);
				});
			await blog.vetoRequest(1, { from: veto, value: 1 }).then(tx => {
				log(`Veto request ${tx.receipt.gasUsed} gas`);
			});
			await blog.appeal(1, { from: blogger2, value: 1 }).then(tx => {
				log(`Appeal request ${tx.receipt.gasUsed} gas`);
			});
			assert.fail("should have thrown before");
		} catch (error) {
			assertJump(error);
		}
	});
	it("Blogger creating a new Appeal request after 7 days ", async () => {
		try {
			await blog
				.newRewardRequest(1, { from: blogger1, value: 2 })
				.then(tx => {
					log(`Adding new reward request ${tx.receipt.gasUsed} gas`);
				});
			await blog.vetoRequest(1, { from: veto, value: 1 }).then(tx => {
				log(`Veto request ${tx.receipt.gasUsed} gas`);
			});
			await web3.currentProvider.sendAsync(
				{
					jsonrpc: "2.0",
					method: "evm_increaseTime",
					params: [86400 * 8], // 86400 seconds in a day
					id: new Date().getTime()
				},
				() => {}
			);
			await blog.appeal(1, { from: blogger1, value: 1 }).then(tx => {
				log(`Appeal request ${tx.receipt.gasUsed} gas`);
			});
			assert.fail("should have thrown before");
		} catch (error) {
			assertJump(error);
		}
	});
	it("Creating a new Appeal request without any veto", async () => {
		try {
			await blog
				.newRewardRequest(1, { from: blogger1, value: 2 })
				.then(tx => {
					log(`Adding new reward request ${tx.receipt.gasUsed} gas`);
				});
			await blog.appeal(1, { from: blogger1, value: 1 }).then(tx => {
				log(`Appeal request ${tx.receipt.gasUsed} gas`);
			});
			assert.fail("should have thrown before");
		} catch (error) {
			assertJump(error);
		}
	});

	// verdict

	it("Company will decide the result", async () => {
		await blog
			.newRewardRequest(1, { from: blogger1, value: 2 })
			.then(tx => {
				log(`Adding new reward request ${tx.receipt.gasUsed} gas`);
			});
		await blog.vetoRequest(1, { from: veto, value: 1 }).then(tx => {
			log(`Veto request ${tx.receipt.gasUsed} gas`);
		});
		await blog.appeal(1, { from: blogger1, value: 1 }).then(tx => {
			log(`Appeal request ${tx.receipt.gasUsed} gas`);
		});
		await blog.verdict(1, true, { from: owner }).then(tx => {
			log(`Verdict request ${tx.receipt.gasUsed} gas`);
		});
	});
	it("Random user trying to decide the result", async () => {
		try {
			await blog
				.newRewardRequest(1, { from: blogger1, value: 2 })
				.then(tx => {
					log(`Adding new reward request ${tx.receipt.gasUsed} gas`);
				});
			await blog.vetoRequest(1, { from: veto, value: 1 }).then(tx => {
				log(`Veto request ${tx.receipt.gasUsed} gas`);
			});
			await blog.appeal(1, { from: blogger1, value: 1 }).then(tx => {
				log(`Appeal request ${tx.receipt.gasUsed} gas`);
			});
			await blog.verdict(1, true, { from: blogger2 }).then(tx => {
				log(`Verdict request ${tx.receipt.gasUsed} gas`);
			});
			assert.fail("should have thrown before");
		} catch (error) {
			assertJump(error);
		}
	});
	it("Owner trying to decide the result when no appeal", async () => {
		try {
			await blog
				.newRewardRequest(1, { from: blogger1, value: 2 })
				.then(tx => {
					log(`Adding new reward request ${tx.receipt.gasUsed} gas`);
				});
			await blog.vetoRequest(1, { from: veto, value: 1 }).then(tx => {
				log(`Veto request ${tx.receipt.gasUsed} gas`);
			});
			await blog.verdict(1, true, { from: owner }).then(tx => {
				log(`Verdict request ${tx.receipt.gasUsed} gas`);
			});
			assert.fail("should have thrown before");
		} catch (error) {
			assertJump(error);
		}
	});
	it("Owner trying to decide the result when no veto", async () => {
		try {
			await blog
				.newRewardRequest(1, { from: blogger1, value: 2 })
				.then(tx => {
					log(`Adding new reward request ${tx.receipt.gasUsed} gas`);
				});
			await blog.verdict(1, true, { from: owner }).then(tx => {
				log(`Verdict request ${tx.receipt.gasUsed} gas`);
			});
			assert.fail("should have thrown before");
		} catch (error) {
			assertJump(error);
		}
	});

	// Blogger Payout

	it("Blogger demanding payout after 28 days without veto request", async () => {
		await blog
			.newRewardRequest(1, { from: blogger1, value: 2 })
			.then(tx => {
				log(`Adding new reward request ${tx.receipt.gasUsed} gas`);
			});
		await web3.currentProvider.sendAsync(
			{
				jsonrpc: "2.0",
				method: "evm_increaseTime",
				params: [86400 * 29], // 86400 seconds in a day
				id: new Date().getTime()
			},
			() => {}
		);
		await blog.bloggerPayout(1, { from: blogger1 }).then(tx => {
			log(`Blogger Payout request ${tx.receipt.gasUsed} gas`);
		});
	});
	it("Blogger demanding payout within 28 days when verdict in favor", async () => {
		await blog
			.newRewardRequest(1, { from: blogger1, value: 2 })
			.then(tx => {
				log(`Adding new reward request ${tx.receipt.gasUsed} gas`);
			});
		await blog.vetoRequest(1, { from: veto, value: 1 }).then(tx => {
			log(`Veto request ${tx.receipt.gasUsed} gas`);
		});
		await blog.appeal(1, { from: blogger1, value: 1 }).then(tx => {
			log(`Appeal request ${tx.receipt.gasUsed} gas`);
		});
		await blog.verdict(1, true, { from: owner }).then(tx => {
			log(`Verdict request ${tx.receipt.gasUsed} gas`);
		});
		await blog.bloggerPayout(1, { from: blogger1 }).then(tx => {
			log(`Blogger Payout request ${tx.receipt.gasUsed} gas`);
		});
	});
	it("Random user demanding payout within 28 days when verdict in favor", async () => {
		try {
			await blog
				.newRewardRequest(1, { from: blogger1, value: 2 })
				.then(tx => {
					log(`Adding new reward request ${tx.receipt.gasUsed} gas`);
				});
			await blog.vetoRequest(1, { from: veto, value: 1 }).then(tx => {
				log(`Veto request ${tx.receipt.gasUsed} gas`);
			});

			await blog.appeal(1, { from: blogger1, value: 1 }).then(tx => {
				log(`Appeal request ${tx.receipt.gasUsed} gas`);
			});
			await blog.verdict(1, true, { from: owner }).then(tx => {
				log(`Verdict request ${tx.receipt.gasUsed} gas`);
			});
			await blog.bloggerPayout(1, { from: blogger2 }).then(tx => {
				log(`Blogger Payout request ${tx.receipt.gasUsed} gas`);
			});
			assert.fail("should have thrown before");
		} catch (error) {
			assertJump(error);
		}
	});
	it("Blogger demanding payout when lost", async () => {
		try {
			await blog
				.newRewardRequest(1, { from: blogger1, value: 2 })
				.then(tx => {
					log(`Adding new reward request ${tx.receipt.gasUsed} gas`);
				});
			await blog.vetoRequest(1, { from: veto, value: 1 }).then(tx => {
				log(`Veto request ${tx.receipt.gasUsed} gas`);
			});

			await blog.appeal(1, { from: blogger1, value: 1 }).then(tx => {
				log(`Appeal request ${tx.receipt.gasUsed} gas`);
			});
			await blog.verdict(1, false, { from: blogger1 }).then(tx => {
				log(`Verdict ${tx.receipt.gasUsed} gas`);
			});
			await blog.bloggerPayout(1, { from: blogger1 }).then(tx => {
				log(`Blogger Payout request ${tx.receipt.gasUsed} gas`);
			});
			assert.fail("should have thrown before");
		} catch (error) {
			assertJump(error);
		}
	});
	it("Blogger demanding payout when verdict is yet to decide the result", async () => {
		try {
			await blog
				.newRewardRequest(1, { from: blogger1, value: 2 })
				.then(tx => {
					log(`Adding new reward request ${tx.receipt.gasUsed} gas`);
				});
			await blog.vetoRequest(1, { from: veto, value: 1 }).then(tx => {
				log(`Veto request ${tx.receipt.gasUsed} gas`);
			});

			await blog.appeal(1, { from: blogger1, value: 1 }).then(tx => {
				log(`Appeal request ${tx.receipt.gasUsed} gas`);
			});

			await blog.bloggerPayout(1, { from: blogger1 }).then(tx => {
				log(`Blogger Payout request ${tx.receipt.gasUsed} gas`);
			});
			assert.fail("should have thrown before");
		} catch (error) {
			assertJump(error);
		}
	});
	it("Blogger demanding payout when no veto request is created before 28 days", async () => {
		try {
			await blog
				.newRewardRequest(1, { from: blogger1, value: 2 })
				.then(tx => {
					log(`Adding new reward request ${tx.receipt.gasUsed} gas`);
				});

			await blog.bloggerPayout(1, { from: blogger1 }).then(tx => {
				log(`Blogger Payout request ${tx.receipt.gasUsed} gas`);
			});
			assert.fail("should have thrown before");
		} catch (error) {
			assertJump(error);
		}
	});

	// Veto Payout

	it("Veto demanding payout within 7 days when verdict in favor", async () => {
		await blog
			.newRewardRequest(1, { from: blogger1, value: 2 })
			.then(tx => {
				log(`Adding new reward request ${tx.receipt.gasUsed} gas`);
			});
		await blog.vetoRequest(1, { from: veto, value: 1 }).then(tx => {
			log(`Veto request ${tx.receipt.gasUsed} gas`);
		});
		await blog.appeal(1, { from: blogger1, value: 1 }).then(tx => {
			log(`Appeal request ${tx.receipt.gasUsed} gas`);
		});
		await blog.verdict(1, false, { from: owner }).then(tx => {
			log(`Verdict request ${tx.receipt.gasUsed} gas`);
		});

		await blog.vetoPayout(1, { from: veto }).then(tx => {
			log(`Veto Payout request ${tx.receipt.gasUsed} gas`);
		});
	});
	it("Random user demanding payout within 7 days when verdict in favor", async () => {
		try {
			await blog
				.newRewardRequest(1, { from: blogger1, value: 2 })
				.then(tx => {
					log(`Adding new reward request ${tx.receipt.gasUsed} gas`);
				});
			await blog.vetoRequest(1, { from: veto, value: 1 }).then(tx => {
				log(`Veto request ${tx.receipt.gasUsed} gas`);
			});

			await blog.appeal(1, { from: blogger1, value: 1 }).then(tx => {
				log(`Appeal request ${tx.receipt.gasUsed} gas`);
			});
			await blog.verdict(1, false, { from: owner }).then(tx => {
				log(`Verdict request ${tx.receipt.gasUsed} gas`);
			});

			await blog.vetoPayout(1, { from: blogger2 }).then(tx => {
				log(`Veto Payout request ${tx.receipt.gasUsed} gas`);
			});
			assert.fail("should have thrown before");
		} catch (error) {
			assertJump(error);
		}
	});
	it("Veto demanding payout when lost", async () => {
		try {
			await blog
				.newRewardRequest(1, { from: blogger1, value: 2 })
				.then(tx => {
					log(`Adding new reward request ${tx.receipt.gasUsed} gas`);
				});
			await blog.vetoRequest(1, { from: veto, value: 1 }).then(tx => {
				log(`Veto request ${tx.receipt.gasUsed} gas`);
			});

			await blog.appeal(1, { from: blogger1, value: 1 }).then(tx => {
				log(`Appeal request ${tx.receipt.gasUsed} gas`);
			});
			await blog.verdict(1, true, { from: blogger1 }).then(tx => {
				log(`Verdict request ${tx.receipt.gasUsed} gas`);
			});

			await blog.vetoPayout(1, { from: veto }).then(tx => {
				log(`Veto Payout request ${tx.receipt.gasUsed} gas`);
			});
			assert.fail("should have thrown before");
		} catch (error) {
			assertJump(error);
		}
	});
	it("Veto demanding payout when no appeal and 7 days past the veto", async () => {
		await blog
			.newRewardRequest(1, { from: blogger1, value: 2 })
			.then(tx => {
				log(`Adding new reward request ${tx.receipt.gasUsed} gas`);
			});
		await blog.vetoRequest(1, { from: veto, value: 1 }).then(tx => {
			log(`Veto request ${tx.receipt.gasUsed} gas`);
		});
		await web3.currentProvider.sendAsync(
			{
				jsonrpc: "2.0",
				method: "evm_increaseTime",
				params: [86400 * 8], // 86400 seconds in a day
				id: new Date().getTime()
			},
			() => {}
		);
		await blog.vetoPayout(1, { from: veto }).then(tx => {
			log(`Veto request ${tx.receipt.gasUsed} gas`);
		});
	});
	it("Veto demanding payout when verdict is yet to decide the result", async () => {
		try {
			await blog
				.newRewardRequest(1, { from: blogger1, value: 2 })
				.then(tx => {
					log(`Adding new reward request ${tx.receipt.gasUsed} gas`);
				});
			await blog.vetoRequest(1, { from: veto, value: 1 }).then(tx => {
				log(`Veto request ${tx.receipt.gasUsed} gas`);
			});

			await blog.appeal(1, { from: blogger1, value: 1 }).then(tx => {
				log(`Appeal request ${tx.receipt.gasUsed} gas`);
			});

			await blog.vetoPayout(1, { from: blogger1 }).then(tx => {
				log(`Veto Payout request ${tx.receipt.gasUsed} gas`);
			});
			assert.fail("should have thrown before");
		} catch (error) {
			assertJump(error);
		}
	});
	it("Veto demanding payout when no veto request", async () => {
		try {
			await blog
				.newRewardRequest(1, { from: blogger1, value: 2 })
				.then(tx => {
					log(`Adding new reward request ${tx.receipt.gasUsed} gas`);
				});

			await blog.vetoPayout(1, { from: veto }).then(tx => {
				log(`Veto Payout request ${tx.receipt.gasUsed} gas`);
			});
			assert.fail("should have thrown before");
		} catch (error) {
			assertJump(error);
		}
	});
});
