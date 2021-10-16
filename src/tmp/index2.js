import { LCDClient } from "@terra-money/terra.js"
import { Anchor, columbus5, AddressProviderFromJson } from "@anchor-protocol/anchor.js"
import { AnchorEarn, CHAINS, NETWORKS, DENOMS } from "@anchor-protocol/anchor-earn"
import Decimal from "decimal.js"

const LCD_URL = "https://lcd.terra.dev"
const CHAIN_ID = "columbus-5"

const client = new LCDClient({
  URL: LCD_URL,
  chainID: CHAIN_ID,
})

// Initialization of the Anchor Client
const provider = columbus5
const addressProvider = new AddressProviderFromJson(provider)
const anchor = new Anchor(client, addressProvider)

const walletDenom = {
  address: "terra..xxxxxxxxxxxxxxx",
  market: "UST",
}

const anchorEarn = new AnchorEarn({ chain: CHAINS.TERRA, network: NETWORKS.COLUMBUS_4, address: "terra..xxxxxxxxxxxxx" })

async function main() {
  try {
    const balanceInfo = await anchorEarn.balance({ currencies: [DENOMS.UST] })
    console.log(balanceInfo)
    const borrowedValue = new Decimal(await anchor.borrow.getBorrowedValue(walletDenom))
    console.log("borrowed value:", borrowedValue)
    const borrowLimit = new Decimal(await anchor.borrow.getBorrowLimit(walletDenom))
    console.log("borrow Limit:", borrowLimit)

    const ltv = borrowedValue.dividedBy(borrowLimit.times(10).dividedBy(6)).times(100)
    console.log("ltv:", ltv)
  } catch (e) {
    console.log(e)
  }
}

main()
