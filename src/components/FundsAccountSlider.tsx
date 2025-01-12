export type FundsAccountType = {
    funds: number
    costs_incurred: number
  }

const FundsAccountSlider = ({
    account
}: {
    account: FundsAccountType | null
}) => {
    if (!account) {
        return null
    }

    const remainingFunds = (account.funds ?? 0) - (account.costs_incurred ?? 0);

    if (remainingFunds <= 0) {
        return (
            <div class="flex flex-col bg-red-50 text-red-500 text-center w-full px-4 py-3">
                <div>I set aside ${account.funds} to pay for the embeddings which already ran out! If you want to top-up the site's balance while I work on adding accounts, reach out on Discord @ zlenner.</div>
            </div>
        )
    } else {
        return null
    }
}

export default FundsAccountSlider;