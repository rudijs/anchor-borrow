import { Bot } from "./src/bot.js"

if (!process.env.TERRA_MNEMONIC) throw new Error("Missing TERRA_MNEMONIC env var")

async function main() {
  const bot = new Bot()

  console.log(await bot.getBorrowBalance())
  console.log(await bot.getAnchorBalance())
}

main()
