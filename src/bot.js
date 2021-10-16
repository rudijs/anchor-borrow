import { LCDClient, MnemonicKey } from "@terra-money/terra.js"
import { Anchor, columbus5, AddressProviderFromJson } from "@anchor-protocol/anchor.js"
import { AnchorEarn, CHAINS, NETWORKS, DENOMS } from "@anchor-protocol/anchor-earn"
import Decimal from "decimal.js"

if (!process.env.TERRA_MNEMONIC) throw new Error("Missing TERRA_MNEMONIC env var")

const MICRO_MULTIPLIER = 1_000_000

export class Bot {
  LCD_URL = "https://lcd.terra.dev"
  CHAIN_ID = "columbus-5"

  constructor() {
    this.client = new LCDClient({
      URL: this.LCD_URL,
      chainID: this.CHAIN_ID,
    })

    this.mk = new MnemonicKey({
      mnemonic: process.env.TERRA_MNEMONIC,
    })

    this.wallet = this.client.wallet(this.mk)

    this.anchorEarn = new AnchorEarn({ chain: CHAINS.TERRA, network: NETWORKS.COLUMBUS_4, address: this.wallet.key.accAddress })

    // Initialization of the Anchor Client
    this.provider = columbus5
    this.addressProvider = new AddressProviderFromJson(this.provider)
    this.anchor = new Anchor(this.client, this.addressProvider)
  }

  // terra wallet balance
  async getBorrowBalance() {
    // const coins = await this.client.bank.balance(this.wallet.key.accAddress)
    // console.log(coins)
    // coins.get("uusd").amount.dividedBy(MICRO_MULTIPLIER)

    const walletDenom = {
      address: this.wallet.key.accAddress,
      market: "UST",
    }

    const borrowedValue = new Decimal(await this.anchor.borrow.getBorrowedValue(walletDenom))
    // console.log("borrowed value:", borrowedValue)

    const borrowLimit = new Decimal(await this.anchor.borrow.getBorrowLimit(walletDenom))
    // console.log("borrow Limit:", borrowLimit)

    const ltv = borrowedValue.dividedBy(borrowLimit.times(10).dividedBy(6)).times(100)
    // console.log("ltv:", ltv)

    return {
      // uusd: coins.get("uusd").amount.dividedBy(MICRO_MULTIPLIER),
      borrowedValue,
      borrowLimit,
      ltv,
    }
  }

  // anchor dapp balance
  async getAnchorBalance() {
    const balanceInfo = await this.anchorEarn.balance({ currencies: [DENOMS.UST] })
    // console.log(balanceInfo)
    return balanceInfo.balances
  }
}
