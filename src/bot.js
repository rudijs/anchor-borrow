import { LCDClient, MnemonicKey } from "@terra-money/terra.js"
import { Anchor, columbus5, AddressProviderFromJson, COLLATERAL_DENOMS, queryRewardAccrued, MARKET_DENOMS } from "@anchor-protocol/anchor.js"
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

    this.config = {
      ltv: {
        // This define the limit when the bot will repay your debt.
        limit: process.env.LTV_LIMIT || 48, //53,

        // This define the safe-limit that the bot will reach when repaying or borrowing more.
        safe: process.env.LTV_SAFE || 40, //45,

        // This define the low-limit when the bot will borrow more.
        borrow: process.env.LTV_BORROW || 35, //40,
      },
    }

    this.borrowState = {}
    this.balanceState = {}
  }

  async getBalanceState() {
    const coins = await this.client.bank.balance(this.wallet.key.accAddress)
    this.balanceState.total_account_balance_in_luna = coins.get("uluna").amount.dividedBy(MICRO_MULTIPLIER)

    const balanceInfo = await this.anchorEarn.balance({ currencies: [DENOMS.UST] })
    this.balanceState.total_account_balance_in_ust = new Decimal(balanceInfo.total_account_balance_in_ust)
    this.balanceState.total_deposit_balance_in_ust = new Decimal(balanceInfo.total_deposit_balance_in_ust)
    // console.log(balanceInfo)

    const earnAPY = await this.anchor.earn.getAPY({ market: MARKET_DENOMS.UUSD })
    this.balanceState.earnAPY = new Decimal(new Decimal(earnAPY).mul(100).toFixed(2))

    const anchorBalance = new Decimal(await this.anchor.anchorToken.getBalance(this.wallet.key.accAddress))
    this.balanceState.balance_in_anc = anchorBalance

    const ancPrice = new Decimal(await this.anchor.anchorToken.getANCPrice())
    this.balanceState.ancPrice = ancPrice

    this.balanceState.total_anc_balance_in_ust = anchorBalance.mul(ancPrice)
  }

  // terra wallet balance
  async getBorrowState() {
    const walletDenom = {
      address: this.wallet.key.accAddress,
      market: "UST",
    }

    const collaterals = await this.anchor.borrow.getCollaterals({ address: this.wallet.key.accAddress, market: COLLATERAL_DENOMS.UBLUNA })
    const b = collaterals.filter((item) => item.collateral === this.addressProvider.bLunaToken())
    const bLunaCollateral = new Decimal(b[0].balance).dividedBy(MICRO_MULTIPLIER)
    this.borrowState.bLunaCollateral = bLunaCollateral

    const borrowedValue = new Decimal(await this.anchor.borrow.getBorrowedValue(walletDenom))
    this.borrowState.borrowedValue = borrowedValue

    const borrowLimit = new Decimal(await this.anchor.borrow.getBorrowLimit(walletDenom))
    this.borrowState.borrowLimit = borrowLimit

    const ltv = borrowedValue.dividedBy(borrowLimit.times(10).dividedBy(6)).times(100)
    this.borrowState.ltv = ltv

    const currentBlunaLiquidationEstimate = borrowedValue.mul(1.666666).dividedBy(bLunaCollateral)
    this.borrowState.currentBlunaLiquidationEstimate = currentBlunaLiquidationEstimate

    // TODO: not sure if this is correct, to check
    const q = queryRewardAccrued({ lcd: this.client, address: this.wallet.key.accAddress })
    const ancRewardsValue = await q(this.addressProvider)
    this.borrowState.ancRewardsValue = new Decimal(ancRewardsValue.rewards).dividedBy(10000)

    return {
      borrowedValue,
      borrowLimit,
      ltv,
    }
  }

  info() {
    console.log("Balance State:")
    console.log(this.balanceState)

    console.log("Borrow State:")
    console.log(this.borrowState)

    console.log("Config:")
    console.log(this.config)
    // console.log("Borrowed:,", this.borrowState.borrowedValue)
    // console.log("Borrow Limit:", this.borrowState.borrowLimit)
    // console.log("LTV:", this.borrowState.ltv)
  }

  // anchor dapp balance
  async getAnchorBalance() {
    const balanceInfo = await this.anchorEarn.balance({ currencies: [DENOMS.UST] })
    // console.log(balanceInfo)
    return balanceInfo.balances
  }

  async computeAmountToBorrow(target = this.config.ltv.safe) {
    console.log("borrow target:", target)
    return new Decimal(target).times(this.borrowState.borrowLimit.times(10).dividedBy(6)).dividedBy(100).minus(this.borrowState.borrowedValue)
  }

  async computeAmountToRepay(target = this.config.ltv.safe) {
    console.log("repay target:", target)
    const amountForSafeZone = new Decimal(target).times(this.borrowState.borrowLimit.times(10).dividedBy(6)).dividedBy(100)
    // console.log(amountForSafeZone)
    return this.borrowState.borrowedValue.minus(amountForSafeZone)
  }

  // 	computeBorrowMessage(amount) {
  // 	return this.#anchor.borrow
  // 		.borrow({ amount: amount.toFixed(3), market: MARKET_DENOMS.UUSD })
  // 		.generateWithWallet(this.#wallet)
  // }
}
