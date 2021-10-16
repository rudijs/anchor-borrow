import { LCDClient } from "@terra-money/terra.js"

const LCD_URL = "https://lcd.terra.dev"
const CHAIN_ID = "columbus-5"

const terra = new LCDClient({
  URL: LCD_URL,
  chainID: CHAIN_ID,
})

async function main() {
  const marketParams = await terra.market.parameters()
  const exchangeRates = await terra.oracle.exchangeRates()
  console.log(marketParams)
  console.log(marketParams.base_pool)
  console.log(exchangeRates.get("uusd"))
}

main()
