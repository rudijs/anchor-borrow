import { Bot } from "./src/bot.js"

if (!process.env.TERRA_MNEMONIC) throw new Error("Missing TERRA_MNEMONIC env var")

async function main() {
  const bot = new Bot()

  await bot.getBalanceState()
  await bot.getBorrowState()

  bot.info()

  console.log("Action")

  if (bot.borrowState.ltv < bot.config.ltv.borrow) {
    console.log("borrow more")
    console.log("borrow amout:", await bot.computeAmountToBorrow())
  }

  if (bot.borrowState.ltv > bot.config.ltv.limit) {
    console.log("repay")
    console.log("repay amount:", await bot.computeAmountToRepay())
  }

  // check borrow position state
  // console.log(await bot.getBorrowBalance())
  // console.log(await bot.getAnchorBalance())

  // borrow

  // repay
}

main()
