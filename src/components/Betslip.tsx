'use client'
import React from 'react'
import cx from 'clsx'
import {
  ConditionStatus,
  useBaseBetslip,
  useBetTokenBalance,
  useChain,
  useDetailedBetslip,
  BetslipDisableReason,
  useLiveBetFee,
  usePrepareBet,
} from '@azuro-org/sdk'
import { getMarketName, getSelectionName } from '@azuro-org/dictionaries'
import { useAccount } from 'wagmi'
import dayjs from 'dayjs'

import { useBetslip } from '@/context/betslip'


function AmountInput() {
  const { betAmount, changeBetAmount, maxBet, minBet } = useDetailedBetslip()
  const { betToken } = useChain()
  const { loading: isBalanceFetching, balance } = useBetTokenBalance()

  return (
    <div className="mt-4 pt-4 border-t border-zinc-300 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-md text-zinc-400">Wallet balance:</span>
        <span className="text-md font-semibold">
          {
            isBalanceFetching ? (
              <>Loading...</>
            ) : (
              balance !== undefined ? (
                <>{(+balance).toFixed(2)} {betToken.symbol}</>
              ) : (
                <>-</>
              )
            )
          }
        </span>
      </div>
      {
        Boolean(maxBet) && <div className="flex items-center justify-between">
          <span className="text-md text-zinc-400">Max bet amount:</span>
          <span className="text-md font-semibold">{maxBet} {betToken.symbol}</span>
        </div>
      }
      {
        Boolean(minBet) && <div className="flex items-center justify-between">
          <span className="text-md text-zinc-400">Min bet amount:</span>
          <span className="text-md font-semibold">{minBet} {betToken.symbol}</span>
        </div>
      }
      <div className="flex items-center justify-between">
        <span className="text-md text-zinc-400">Bet amount</span>
        <input
          className="w-[140px] py-2 px-4 border border-zinc-400 text-md text-right font-semibold rounded-md"
          type="number"
          placeholder="Bet amount"
          value={betAmount}
          onChange={(event) => changeBetAmount(event.target.value)}
        />
      </div>
    </div>
  )
}

const errorPerDisableReason = {
  [BetslipDisableReason.ComboWithForbiddenItem]: 'One or more conditions can\'t be used in combo',
  [BetslipDisableReason.BetAmountGreaterThanMaxBet]: 'Bet amount exceeds max bet',
  [BetslipDisableReason.BetAmountLowerThanMinBet]: 'Bet amount lower than min bet',
  [BetslipDisableReason.ComboWithLive]: 'Live outcome can\'t be used in combo',
  [BetslipDisableReason.ConditionStatus]: 'One or more outcomes have been removed or suspended. Review your betslip and remove them.',
  [BetslipDisableReason.PrematchConditionInStartedGame]: 'Game has started',
} as const

const SubmitButton: React.FC = () => {
  const { appChain, isRightNetwork } = useChain()
  const { items, clear } = useBaseBetslip()
  const { betAmount, odds, totalOdds, isStatusesFetching, isOddsFetching, isBetAllowed } = useDetailedBetslip()
  const { loading: isBalanceFetching, balance } = useBetTokenBalance()

  const {
    submit,
    approveTx,
    betTx,
    isRelayerFeeLoading,
    isAllowanceLoading,
    isApproveRequired,
  } = usePrepareBet({
    betAmount,
    slippage: 10,
    affiliate: '0x0000000000000000000000000000000000000000', // your affiliate address
    selections: items,
    odds,
    totalOdds,
    onSuccess: () => {
      clear()
    },
  })

  const isPending = approveTx.isPending || betTx.isPending
  const isProcessing = approveTx.isProcessing || betTx.isProcessing

  if (!isRightNetwork) {
    return (
      <div className="mt-6 py-3.5 text-center bg-red-200 rounded-2xl">
        Switch network to <b>{appChain.name}</b> in your wallet
      </div>
    )
  }

  const isEnoughBalance = isBalanceFetching || !Boolean(+betAmount) ? true : Boolean(+balance! > +betAmount)

  const isLoading = (
    isOddsFetching
    || isBalanceFetching
    || isStatusesFetching
    || isAllowanceLoading
    || isPending
    || isProcessing
    || isRelayerFeeLoading
  )

  const isDisabled = (
    isLoading
    || !isBetAllowed
    || !isEnoughBalance
    || !+betAmount
  )

  let title

  if (isPending) {
    title = 'Waiting for approval'
  }
  else if (isProcessing) {
    title = 'Processing...'
  }
  else if (isLoading) {
    title = 'Loading...'
  }
  else if (isApproveRequired) {
    title = 'Approve'
  }
  else {
    title = 'Place Bet'
  }

  return (
    <div className="mt-6">
      {
        !isEnoughBalance && (
          <div className="mb-1 text-red-500 text-center font-semibold">
            Not enough balance.
          </div>
        )
      }
      <button
        className={cx('w-full py-3.5 text-white font-semibold text-center rounded-xl', {
          'bg-blue-500 hover:bg-blue-600 transition shadow-md': !isDisabled,
          'bg-zinc-300 cursor-not-allowed': isDisabled,
        })}
        disabled={isDisabled}
        onClick={submit}
      >
        {title}
      </button>
    </div>
  )
}

function Content() {
  const account = useAccount()
  const { items, clear, removeItem } = useBaseBetslip()
  const { betAmount, odds, totalOdds, statuses, disableReason, isStatusesFetching, isOddsFetching, isLiveBet } = useDetailedBetslip()
  const { formattedRelayerFeeAmount, loading: isRelayerFeeLoading } = useLiveBetFee({
    enabled: isLiveBet,
  })

  return (
    <div className="bg-zinc-100 p-4 mb-4 rounded-md w-full max-h-[90vh] overflow-auto border border-solid">
      <div className="flex items-center justify-between mb-2">
        <div className="">Betslip {items.length > 1 ? 'Combo' : 'Single'} {items.length ? `(${items.length})` : ''}</div>
        {
          Boolean(items.length) && (
            <button onClick={clear}>Remove All</button>
          )
        }
      </div>
      {
        Boolean(items.length) ? (
          <>
            <div className="max-h-[300px] overflow-auto">
              {
                items.map(item => {
                  const { game: { gameId, startsAt, sportName, leagueName, participants }, conditionId, outcomeId } = item

                  const marketName = getMarketName({ outcomeId })
                  const selection = getSelectionName({ outcomeId, withPoint: true })

                  const isLock = !isStatusesFetching && statuses[conditionId] !== ConditionStatus.Created

                  return (
                    <div key={gameId} className="bg-zinc-50 p-2 rounded-md mt-2 first-of-type:mt-0">
                      <div className="flex items-center justify-between mb-2">
                        <div>{sportName} / {leagueName}</div>
                        <button onClick={() => removeItem(gameId)}>Remove</button>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        {
                          participants.map(({ image, name }) => (
                            <div key={name} className="flex items-center ml-2 first-of-type:ml-0">
                              <div className="flex items-center justify-center w-8 h-8 p-1 mr-2 border border-zinc-300 rounded-full">
                                {
                                  Boolean(image) && (
                                    <img className="w-full h-full" src={image!} alt="" />
                                  )
                                }
                              </div>
                              <span className="text-md">{name}</span>
                            </div>
                          ))
                        }
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold">Start Date: </span>
                        {dayjs(+startsAt * 1000).format('DD MMM HH:mm')}
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold">Market: </span>
                        {marketName}
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold">Selection: </span>
                        {selection}
                      </div>
                      <div className="flex items-center justify-between ">
                        <span className="font-bold">Odds: </span>
                        {
                          isOddsFetching ? (
                            <div className="span">Loading...</div>
                          ) : (
                            odds[`${conditionId}-${outcomeId}`]
                          )
                        }
                      </div>
                      {
                        isLock && (
                          <div className="text-orange-200 text-center">Outcome removed or suspended</div>
                        )
                      }
                    </div>
                  )
                })
              }
            </div>
            <div className="flex items-center justify-between mt-4">
              <span className="text-md text-zinc-400">Total Odds:</span>
              <span className="text-md font-semibold">
                {
                  isOddsFetching ? (
                    <>Loading...</>
                  ) : (
                    <>{totalOdds}</>
                  )
                }
              </span>
            </div>
            <div className="flex items-center justify-between mt-4">
              <span className="text-md text-zinc-400">Possible win:</span>
              <span className="text-md font-semibold">
                {
                  isOddsFetching ? (
                    <>Loading...</>
                  ) : (
                    <>{totalOdds * +betAmount}</>
                  )
                }
              </span>
            </div>
            {
              Boolean(isRelayerFeeLoading || formattedRelayerFeeAmount) && (
                <div className="flex items-center justify-between mt-4">
                  <span className="text-md text-zinc-400">Relayer fee:</span>
                  <span className="text-md font-semibold">
                    {
                      isRelayerFeeLoading ? (
                        <>Loading...</>
                      ) : (
                        <>{formattedRelayerFeeAmount}</>
                      )
                    }
                  </span>
                </div>
              )
            }
            <AmountInput />
            {
              Boolean(disableReason) && (
                <div className="mb-1 text-red-500 text-center font-semibold">
                  {errorPerDisableReason[disableReason!]}
                </div>
              )
            }
            {
              account?.address ? (
                <SubmitButton />
              ) : (
                <div className="mt-6 py-3.5 text-center bg-red-200 rounded-2xl">
                  Connect your wallet
                </div>
              )
            }
          </>
        ) : (
          <div>Empty</div>
        )
      }
    </div>
  )
}

export function Betslip() {
  const { isOpen, setOpen } = useBetslip()
  const { items } = useBaseBetslip()

  return (
    <div className="fixed bottom-4 right-4 w-full max-w-full md:max-w-sm">
      {
        isOpen && (
          <Content />
        )
      }
      <button
        className="flex items-center py-2 px-4 bg-zinc-100 whitespace-nowrap rounded-full ml-auto"
        onClick={() => setOpen(!isOpen)}
      >
        Betslip {items.length || ''}
      </button>
    </div>
  )
}