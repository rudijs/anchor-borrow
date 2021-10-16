import { LCDClient, MnemonicKey } from "@terra-money/terra.js"

if (!process.env.TERRA_MNEMONIC) throw new Error("Missing TERRA_MNEMONIC env var")

const LCD_URL = "https://lcd.terra.dev"
const CHAIN_ID = "columbus-5"

const client = new LCDClient({
  URL: LCD_URL,
  chainID: CHAIN_ID,
})

// const mk = new MnemonicKey()
const mk = new MnemonicKey({
  mnemonic: process.env.TERRA_MNEMONIC,
})
// console.log(mk)

const wallet = client.wallet(mk)
// console.log(wallet)
console.log(wallet.key.accAddress)

async function main() {
  const bal = await client.bank.balance(wallet.key.accAddress)
  // console.log(bal)
  return bal
}

main()
  .then((res) => console.log(res))
  .catch((err) => console.log(err))
