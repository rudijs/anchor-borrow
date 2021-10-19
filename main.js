import { Bot } from "./src/bot.js"

if (!process.env.TERRA_MNEMONIC) throw new Error("Missing TERRA_MNEMONIC env var")

async function main() {
  const bot = new Bot()

  await bot.getBalanceState()
  await bot.getBorrowState()

  bot.info()

  console.log("Action")

  // borrow
  if (bot.borrowState.ltv < bot.config.ltv.borrow) {
    console.log("borrow more")
    const amountToBorrow = await bot.computeAmountToBorrow()
    console.log("borrow amout:", amountToBorrow)
    const newBorrowTotal = bot.borrowState.borrowedValue.plus(amountToBorrow)
    console.log("new borrow total", newBorrowTotal)
    const newBlunaLiquidationEstimate = newBorrowTotal.mul(1.666666).dividedBy(bot.borrowState.bLunaCollateral)
    console.log("newBlunaLiquidationEstimate", newBlunaLiquidationEstimate)

    // console.log(await bot.borrow(amountToBorrow))
  }

  // repay
  if (bot.borrowState.ltv > bot.config.ltv.limit) {
    console.log("repay")
    const amountToRepay = await bot.computeAmountToRepay()
    console.log("repay amount:", amountToRepay)
    console.log(await bot.repay(amountToRepay))
  }

  // nothing to do
  if (bot.borrowState.ltv > bot.config.ltv.borrow && bot.borrowState.ltv < bot.config.ltv.limit) {
    console.log("Nothing to do")
  }
}

main()
