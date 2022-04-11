import { useMachine } from "@xstate/react"
import { ChainSlugs } from "connectors"
import { Contract, ContractInterface, Event, utils } from "ethers"
import useToast from "hooks/useToast"
import useTokenXyzContract from "hooks/useTokenXyzContract"
import useWarnIfUnsavedChanges from "hooks/useWarnIfUnsavedChanges"
import { useEffect, useMemo, useRef } from "react"
import { useFormContext } from "react-hook-form"
import DisperseABI from "static/abis/DisperseABI.json"
import MerkleVestingABI from "static/abis/MerkleVestingABI.json"
import {
  AllocationFormType,
  AllocationJSON,
  ContractType,
  TokenInfoJSON,
  TokenIssuanceFormType,
} from "types"
import generateMerkleTree from "utils/merkle/generateMerkleTree"
import { MerkleDistributorInfo, parseBalanceMap } from "utils/merkle/parseBalanceMap"
import slugify from "utils/slugify"
import { erc20ABI, useAccount, useContract, useSigner } from "wagmi"
import { assign, createMachine } from "xstate"

// Converter function which returns the amount of tokens needed to be sent to each vesting/distributor contract
const converter = (input: Array<AllocationFormType>): number => {
  if (!input) return 0
  return input
    .map((allocation) => allocation.allocationAddressesAmounts)
    ?.reduce((arr1, arr2) => arr1.concat(arr2), [])
    ?.filter((item) => !!item)
    ?.map((data) => parseInt(data.amount))
    ?.reduce((amount1, amount2) => amount1 + amount2, 0)
}

const monthsToSecond = (months: number): number =>
  months ? Math.floor(months * 2629743.83) : 0

const useDeploy = () => {
  const [{ data: accountData }] = useAccount()
  const [{ data: signerData }] = useSigner()

  const tokenXyzContract = useTokenXyzContract()
  const disperseContract = useContract({
    addressOrName: process.env.NEXT_PUBLIC_DISPERSE_CONTRACT_ADDRESS,
    contractInterface: DisperseABI as ContractInterface,
    signerOrProvider: signerData,
  })

  const { getValues } = useFormContext<TokenIssuanceFormType>()

  const [
    chain,
    urlName,
    tokenName,
    tokenTicker,
    icon,
    decimals,
    initialSupply,
    maxSupply,
    economyModel,
    transferOwnershipTo,
    tokenType,
    distributionData,
  ] = getValues([
    "chain",
    "urlName",
    "tokenName",
    "tokenTicker",
    "icon",
    "decimals",
    "initialSupply",
    "maxSupply",
    "economyModel",
    "transferOwnershipTo",
    "tokenType",
    "distributionData",
  ])

  const toast = useToast()

  const deployMachine = useRef(
    createMachine<{
      error?: string
      response?: Record<string, any>
      tokenDeployer?: string
      tokenUrlName?: string
      tokenAddress?: string
      merkleVestingContractAddress?: string
      merkleDistributorContractAddresses?: Array<string>
      merkleTrees?: Array<MerkleDistributorInfo>
      abiEncodedMerkleVestingArgs?: string
      abiEncodedMerkleDistributorArgs?: Array<string>
    }>(
      {
        id: "deployMachine",
        initial: "idle",
        context: {},
        states: {
          idle: {
            on: {
              DEPLOY: { target: "testing" },
            },
          },
          testing: {
            invoke: {
              src: "testContractCall",
              onDone: {
                target: "deploying",
                actions: ["logResponse"], // Debug
              },
              onError: {
                target: "idle",
                actions: ["assignErrorToContext", "onError"],
              },
            },
          },
          deploying: {
            invoke: {
              src: "createToken",
              onDone: {
                target: "sendingTokensWithDisperse",
                actions: ["assignResponseToContext", "logResponse"], // Debug
              },
              onError: {
                target: "idle",
                actions: ["assignErrorToContext", "onError"],
              },
            },
          },
          sendingTokensWithDisperse: {
            invoke: {
              src: "sendTokensWithDisperse",
              onDone: {
                target: "creatingMerkleContracts",
                actions: ["assignResponseToContext", "logResponse"], // Debug
              },
              onError: {
                target: "creatingMerkleContracts",
                actions: ["assignErrorToContext", "onDisperseError"],
              },
            },
            on: {
              SKIP: {
                target: "creatingMerkleContracts",
              },
              UPDATE_CONTEXT: {
                actions: ["assignDataToContext"],
              },
            },
          },
          creatingMerkleContracts: {
            invoke: {
              src: "createMerkleContracts",
              onDone: {
                target: "creatingCohorts",
                actions: ["assignResponseToContext", "logResponse"], // Debug...
              },
              onError: {
                target: "verifyingContracts",
                actions: ["assignErrorToContext", "onMerkleContractsError"],
              },
            },
            on: {
              SKIP: {
                target: "verifyingContracts",
              },
              UPDATE_CONTEXT: {
                actions: ["assignDataToContext"],
              },
            },
          },
          creatingCohorts: {
            invoke: {
              src: "addCohorts",
              onDone: {
                target: "fundingContracts",
                actions: ["logResponse"], // Debug...
              },
              onError: {
                target: "fundingContracts",
                actions: ["assignErrorToContext", "onCreateCohortsError"],
              },
            },
            on: {
              SKIP: {
                target: "fundingContracts",
              },
              UPDATE_CONTEXT: {
                actions: ["assignDataToContext"],
              },
            },
          },
          fundingContracts: {
            invoke: {
              src: "fundContracts",
              onDone: {
                target: "verifyingContracts",
                actions: ["logResponse"], // Debug
              },
              onError: {
                target: "idle",
                actions: ["assignErrorToContext", "onError"],
              },
            },
            on: {
              SKIP: {
                target: "verifyingContracts",
              },
              UPDATE_CONTEXT: {
                actions: ["assignDataToContext"],
              },
            },
          },
          verifyingContracts: {
            invoke: {
              src: "verifyContracts",
              onDone: {
                target: "ipfs",
                actions: ["logResponse"], // Debug...
              },
              onError: {
                target: "idle",
                actions: ["assignErrorToContext", "onError"],
              },
            },
          },
          ipfs: {
            invoke: {
              src: "uploadToIpfs",
              onDone: {
                target: "finished",
                actions: ["logResponse"], // Debug...
              },
              onError: {
                target: "idle",
                actions: ["assignErrorToContext", "onError"],
              },
            },
            on: {
              SKIP: {
                target: "finished",
              },
            },
          },
          finished: {
            type: "final",
            entry: "onSuccess",
          },
        },
      },
      {
        actions: {
          clearError: assign({
            error: undefined,
          }),
          assignErrorToContext: assign((_context, event) => {
            console.log("ERR", _context, event)
            return {
              error:
                event.data?.reason ||
                event.data?.message ||
                "An unknown error occurred",
            }
          }),
          assignDataToContext: assign((_, event) => ({
            ...event.data,
          })),
          logResponse: (_context, event) =>
            process.env.NODE_ENV === "development"
              ? console.log("LOGRESPONSE", _context, event)
              : {},
          assignResponseToContext: assign((_context, event) => ({
            response: event?.data,
          })),
          onSuccess: () =>
            toast({
              status: "success",
              title: "Successful token issuance!",
            }),
          onError: (_context) =>
            toast({
              status: "error",
              title: "Uh-oh!",
              description: _context.error,
            }),
          onDisperseError: () =>
            toast({
              title: "Could not distribute tokens",
              description:
                "Do not worry, you'll be able to send these tokens later on your dashboard!",
            }),
          onMerkleContractsError: () =>
            toast({
              title: "Could not deploy airdrop/vesting contracts",
              description:
                "Do not worry, you'll be able to create airdrops and vestings later on your dashboard!",
            }),
          onCreateCohortsError: () =>
            toast({
              title: "Could not create cohorts",
              description:
                "Do not worry, you'll be able to add cohorts to your vesting contract later on your dashboard!",
            }),
        },
      }
    )
  )

  const [state, send] = useMachine(deployMachine.current, {
    services: {
      testContractCall: () => {
        const createType: "createToken" | "createTokenWithRoles" =
          tokenType === "OWNABLE" ? "createToken" : "createTokenWithRoles"

        return tokenXyzContract.callStatic[createType]?.(
          urlName,
          tokenName,
          tokenTicker,
          decimals,
          utils.parseUnits(initialSupply.toString(), decimals),
          utils.parseUnits(
            economyModel === "FIXED" && maxSupply ? maxSupply.toString() : "0",
            decimals
          ),
          transferOwnershipTo || accountData?.address
        )
      },
      createToken: () => {
        const createType: "createToken" | "createTokenWithRoles" =
          tokenType === "OWNABLE" ? "createToken" : "createTokenWithRoles"

        return tokenXyzContract[createType]?.(
          urlName,
          tokenName,
          tokenTicker,
          decimals,
          utils.parseUnits(initialSupply.toString(), decimals),
          utils.parseUnits(
            economyModel === "FIXED" && maxSupply ? maxSupply.toString() : "0",
            decimals
          ),
          transferOwnershipTo || accountData?.address
        ).then((res) => res.wait())
      },
      sendTokensWithDisperse: async (_context) => {
        const tokenDeployedEvent = _context?.response?.events?.find(
          (event) => event.event === "TokenDeployed"
        )

        const [tokenDeployer, tokenUrlName, tokenAddress] = tokenDeployedEvent.args

        // Assinging the data to the context, so we can use these in the upcoming machine states
        send("UPDATE_CONTEXT", {
          data: {
            tokenDeployer,
            tokenUrlName,
            tokenAddress: tokenAddress?.toLowerCase(),
          },
        })

        const disperseDistribution = distributionData?.find(
          (allocation) => allocation.vestingType === "DISTRIBUTE"
        )
        if (!disperseDistribution) return send("SKIP")

        // Allow the Disperse contract to spend tokens from user's wallet
        const disperseAmount = converter(
          distributionData?.filter(
            (allocation) => allocation.vestingType === "DISTRIBUTE"
          )
        )

        const erc20Contract = new Contract(tokenAddress, erc20ABI, signerData)
        const fullAmount = utils.parseUnits(disperseAmount.toString(), decimals)
        const approve = await erc20Contract.approve(
          process.env.NEXT_PUBLIC_DISPERSE_CONTRACT_ADDRESS,
          fullAmount
        )
        const approved = await approve?.wait()

        if (approved) {
          const recipients = disperseDistribution.allocationAddressesAmounts?.map(
            ({ address }) => address
          )

          // TODO: idk if we need parseUnits here...
          const values = disperseDistribution.allocationAddressesAmounts?.map(
            ({ amount }) => utils.parseUnits(amount.toString(), decimals)
          )

          return disperseContract
            .disperseTokenSimple(tokenAddress, recipients, values)
            .then((res) => res.wait())
        }
      },
      createMerkleContracts: async (_context) => {
        // If there's no airdrop/vesting data, we can skip this step
        if (
          !distributionData?.filter(
            (allocation) =>
              allocation.vestingType === "NO_VESTING" ||
              allocation.vestingType === "LINEAR_VESTING"
          )?.length
        )
          return send("SKIP")

        // Generating and storing merkle trees, so we don't need to regenerate them where we need to use them
        const merkleTrees = distributionData.map((allocation) =>
          parseBalanceMap(generateMerkleTree(allocation.allocationAddressesAmounts))
        )

        send("UPDATE_CONTEXT", { data: { merkleTrees } })

        // Preparing the contract calls
        const contractCalls = []
        let abiEncodedMerkleVestingArgs
        const abiEncodedMerkleDistributorArgs = []

        // Deploying 1 vesting contract if needed
        const shouldCreateVesting = distributionData.some(
          (allocation) => allocation.vestingType === "LINEAR_VESTING"
        )

        if (shouldCreateVesting) {
          contractCalls.push(
            tokenXyzContract.interface.encodeFunctionData(
              "createVesting(string,address,address)",
              [_context.tokenUrlName, _context.tokenAddress, _context.tokenDeployer]
            )
          )

          abiEncodedMerkleVestingArgs = utils.defaultAbiCoder
            .encode(
              // address token, address owner
              ["address", "address"],
              [_context.tokenAddress, _context.tokenDeployer]
            )
            ?.replace("0x", "")
        }

        // Preparing the "createAirdrop" call(s)
        distributionData?.forEach((allocation, index) => {
          if (allocation.vestingType !== "NO_VESTING") return

          // Distribution duration in seconds
          const distributionDuration = monthsToSecond(
            allocation.distributionDuration
          )

          contractCalls.push(
            tokenXyzContract.interface.encodeFunctionData(
              "createAirdrop(string,address,bytes32,uint256,address)",
              [
                _context.tokenUrlName,
                _context.tokenAddress,
                merkleTrees?.[index]?.merkleRoot,
                distributionDuration,
                _context.tokenDeployer,
              ]
            )
          )

          abiEncodedMerkleDistributorArgs.push(
            utils.defaultAbiCoder
              .encode(
                // address token, bytes32 merkleRoot, uint256 distributionDuration, address owner
                ["address", "bytes32", "uint256", "address"],
                [
                  _context.tokenAddress,
                  merkleTrees?.[index]?.merkleRoot,
                  distributionDuration,
                  _context.tokenDeployer,
                ]
              )
              ?.replace("0x", "")
          )
        })

        // Saving encoded data to the context, because we'll use it for contract verification
        send("UPDATE_CONTEXT", {
          data: { abiEncodedMerkleVestingArgs, abiEncodedMerkleDistributorArgs },
        })

        return tokenXyzContract
          .multicall(contractCalls)
          .then((multicallRes) => multicallRes?.wait())
      },
      addCohorts: async (_context) => {
        const shouldCreateVesting = distributionData.some(
          (allocation) => allocation.vestingType === "LINEAR_VESTING"
        )

        // If the user deployed MerkleDistributor contracts, save them to the context
        const merkleDistributorDeployedEvents: Array<Event> =
          _context?.response?.events?.filter(
            (event) => event.event === "MerkleDistributorDeployed"
          )
        if (merkleDistributorDeployedEvents?.length) {
          const merkleDistributorContractAddresses: Array<string> = []

          merkleDistributorDeployedEvents.forEach((event) => {
            const [, , merkleDistributorContractAddress] = event.args

            merkleDistributorContractAddresses.push(merkleDistributorContractAddress)
          })

          send("UPDATE_CONTEXT", {
            data: { merkleDistributorContractAddresses },
          })
        }

        // Check if the user deployed a MerkleVesting contract. If so, save its data to the context and prepare the `addCohort` calls.
        const merkleVestingDeployedEvent: Event = _context?.response?.events?.find(
          (event) => event.event === "MerkleVestingDeployed"
        )

        if (!shouldCreateVesting || !merkleVestingDeployedEvent) return send("SKIP")

        const [, , merkleVestingContractAddress] = merkleVestingDeployedEvent.args

        send("UPDATE_CONTEXT", { data: { merkleVestingContractAddress } })

        const merkleVestingContract = new Contract(
          merkleVestingContractAddress,
          MerkleVestingABI,
          signerData
        )

        const addCohortCalls = []

        // Preparing the "addCohort" calls
        distributionData?.forEach((allocation, index) => {
          if (allocation.vestingType !== "LINEAR_VESTING") return

          // Distribution duration in seconds
          const distributionDuration = monthsToSecond(
            allocation.distributionDuration
          )

          const cliff = monthsToSecond(allocation.cliff)
          const vestingPeriod = monthsToSecond(allocation.vestingPeriod)

          console.log(
            "ADDCOHORT",
            _context.merkleTrees?.[index]?.merkleRoot,
            distributionDuration,
            vestingPeriod,
            cliff
          )
          addCohortCalls.push(
            merkleVestingContract.interface.encodeFunctionData(
              "addCohort(bytes32,uint256,uint64,uint64)",
              [
                _context.merkleTrees?.[index]?.merkleRoot,
                distributionDuration,
                vestingPeriod,
                cliff,
              ]
            )
          )
        })

        return merkleVestingContract
          .multicall(addCohortCalls)
          .then((addCohortCallsRes) => addCohortCallsRes?.wait())
      },
      fundContracts: async (_context) => {
        // If the token owner won't be the current user, skip this step and allow the owner to fund the contracts later.
        if (
          transferOwnershipTo &&
          transferOwnershipTo?.toLowerCase() !== accountData?.address?.toLowerCase()
        ) {
          toast({
            title: "Can't fund contracts",
            description:
              "Since you won't be the owner of this token, the token owner will need to fund the airdrop/vesting contracts later in the dashboard!",
          })

          return send("SKIP")
        }

        const airdropAmount = converter(
          distributionData?.filter(
            (allocation) => allocation.vestingType === "NO_VESTING"
          )
        )
        const vestingAmount = converter(
          distributionData?.filter(
            (allocation) => allocation.vestingType === "LINEAR_VESTING"
          )
        )

        // This should not happen, but in case something goes wrong, we can skip this step (and maybe fund the contracts manually later)
        if (!airdropAmount && !vestingAmount) return send("SKIP")

        const deployedTokenContract = new Contract(
          _context.tokenAddress,
          erc20ABI,
          signerData
        )

        const transfers = []

        if (_context.merkleDistributorContractAddresses?.length && airdropAmount) {
          distributionData
            ?.filter((allocation) => allocation.vestingType === "NO_VESTING")
            ?.forEach((allocation, index) => {
              const fundingAmount = allocation.allocationAddressesAmounts
                ?.map((data) => parseInt(data.amount))
                ?.reduce((amount1, amount2) => amount1 + amount2, 0)

              transfers.push(
                deployedTokenContract
                  ?.transfer(
                    _context.merkleDistributorContractAddresses[index],
                    utils.parseUnits(fundingAmount.toString(), decimals)
                  )
                  .then((res) => res.wait())
              )
            })
        }

        if (_context.merkleVestingContractAddress && vestingAmount) {
          transfers.push(
            deployedTokenContract
              ?.transfer(
                _context.merkleVestingContractAddress,
                utils.parseUnits(vestingAmount.toString(), decimals)
              )
              .then((res) => res.wait())
          )
        }

        return Promise.all(transfers)
      },
      verifyContracts: async (_context) => {
        const verificationRequests = []

        if (_context.tokenAddress) {
          const createType: "createToken" | "createTokenWithRoles" =
            tokenType === "OWNABLE" ? "createToken" : "createTokenWithRoles"

          let contractType: ContractType

          console.log("initialSupply: ", initialSupply, ", maxSupply: ", maxSupply)
          if (initialSupply === 0 || maxSupply === 0 || initialSupply < maxSupply) {
            if (maxSupply > 0)
              contractType =
                createType === "createToken"
                  ? "erc20mintableownedmaxsupply"
                  : "erc20mintableaccesscontrolledmaxsupply"
            else
              contractType =
                createType === "createToken"
                  ? "erc20mintableowned"
                  : "erc20mintableaccesscontrolled"
          } else if (initialSupply === maxSupply) {
            contractType = "erc20initialsupply"
          }

          console.log("contract type should be", contractType)

          let argTypes = []
          let args = []

          switch (contractType) {
            case "erc20mintableaccesscontrolled":
              // string name, string symbol, uint8 tokenDecimals, address minter, uint256 initialSupply
              argTypes = ["string", "string", "uint8", "address", "uint256"]
              args = [
                tokenName,
                tokenTicker,
                decimals,
                transferOwnershipTo || accountData?.address,
                utils.parseUnits(initialSupply.toString(), decimals),
              ]
              break
            case "erc20mintableaccesscontrolledmaxsupply":
              // string name, string symbol, uint8 tokenDecimals, address minter, uint256 initialSupply, uint256 maxSupply
              argTypes = [
                "string",
                "string",
                "uint8",
                "address",
                "uint256",
                "uint256",
              ]
              args = [
                tokenName,
                tokenTicker,
                decimals,
                transferOwnershipTo || accountData?.address,
                utils.parseUnits(initialSupply.toString(), decimals),
                utils.parseUnits(maxSupply.toString(), decimals),
              ]
              break
            case "erc20mintableowned":
              // string name, string symbol, uint8 tokenDecimals, address minter, uint256 initialSupply
              argTypes = ["string", "string", "uint8", "address", "uint256"]
              args = [
                tokenName,
                tokenTicker,
                decimals,
                transferOwnershipTo || accountData?.address,
                utils.parseUnits(initialSupply.toString(), decimals),
              ]
              break
            case "erc20mintableownedmaxsupply":
              // string name, string symbol, uint8 tokenDecimals, address minter, uint256 initialSupply, uint256 maxSupply
              argTypes = [
                "string",
                "string",
                "uint8",
                "address",
                "uint256",
                "uint256",
              ]
              args = [
                tokenName,
                tokenTicker,
                decimals,
                transferOwnershipTo || accountData?.address,
                utils.parseUnits(initialSupply.toString(), decimals),
                utils.parseUnits(maxSupply.toString(), decimals),
              ]
              break
            default:
              // string name, string symbol
              argTypes = ["string", "string"]
              args = [tokenName, tokenTicker]
          }

          const abiEncodedConstructorArguments = utils.defaultAbiCoder
            .encode(argTypes, args)
            ?.replace("0x", "")

          console.log(
            "TOKEN CONTRACT VERIFICATION ARGS:",
            abiEncodedConstructorArguments,
            "\nContract type:",
            contractType
          )

          verificationRequests.push(
            fetch("/api/verify-contract", {
              method: "POST",
              body: JSON.stringify({
                chain: chain,
                contractAddress: _context.tokenAddress,
                contractType: contractType,
                constructorArguments: abiEncodedConstructorArguments,
              }),
            })
          )
        }

        if (
          _context.merkleDistributorContractAddresses?.length &&
          _context.abiEncodedMerkleDistributorArgs?.length
        ) {
          _context.merkleDistributorContractAddresses.forEach((contract, index) => {
            verificationRequests.push(
              fetch("/api/verify-contract", {
                method: "POST",
                body: JSON.stringify({
                  chain: chain,
                  contractAddress: contract,
                  contractType: "merkledistributor",
                  constructorArguments:
                    _context.abiEncodedMerkleDistributorArgs[index],
                }),
              })
            )

            console.log(
              "MERKLE DISTRIBUTOR CONTRACT VERIFICATION ARGS:",
              _context.abiEncodedMerkleDistributorArgs[index],
              "\nContract type: merkledistributor\nContract address: ",
              contract
            )
          })
        }

        if (
          _context.merkleVestingContractAddress &&
          _context.abiEncodedMerkleVestingArgs
        ) {
          verificationRequests.push(
            fetch("/api/verify-contract", {
              method: "POST",
              body: JSON.stringify({
                chain: chain,
                contractAddress: _context.merkleVestingContractAddress,
                contractType: "merklevesting",
                constructorArguments: _context.abiEncodedMerkleVestingArgs,
              }),
            })
          )

          console.log(
            "MERKLE VESTING CONTRACT VERIFICATION ARGS:",
            _context.abiEncodedMerkleVestingArgs,
            "\nContract type: merklevesting\nContract address: ",
            _context.merkleVestingContractAddress
          )
        }

        return Promise.all(verificationRequests)
      },
      uploadToIpfs: async (_context) => {
        // TEMP, only for development purposes
        console.log(
          `DEPLOYED CONTRACTS:\n--------------------\nToken: ${_context.tokenAddress}\nMerkleDistributor: ${_context.merkleDistributorContractAddresses}\nMerkleVesting:${_context.merkleVestingContractAddress}\n----------`
        )

        const ipfsData = new FormData()
        ipfsData.append("dirName", `${ChainSlugs[chain]}/${_context.tokenAddress}`)

        const info: TokenInfoJSON = {
          icon: null,
          displayInExplorer: true,
          airdrops: [],
          vestings: [],
        }

        const allocationJSONs: Array<AllocationJSON> = []

        const currentDateInSeconds = Math.floor(Date.now() / 1000) + 60 // Adding 1 minute, because the deployment could take some time

        const airdrops = distributionData?.filter(
          (allocation) => allocation.vestingType === "NO_VESTING"
        )

        if (
          airdrops?.length &&
          _context.merkleDistributorContractAddresses?.length
        ) {
          airdrops.forEach((airdrop, index) => {
            const originalIndex = distributionData.findIndex(
              (allocation) =>
                allocation.allocationName.toLowerCase() ===
                airdrop.allocationName.toLowerCase()
            )

            const distributionDurationInSeconds = monthsToSecond(
              airdrop.distributionDuration
            )
            const distributionEnd = Math.round(
              currentDateInSeconds + distributionDurationInSeconds
            )

            const allocationData: AllocationJSON = {
              vestingType: "NO_VESTING",
              name: airdrop.allocationName,
              createdBy: accountData?.address,
              createdAt: currentDateInSeconds,
              merkleDistribution: {
                contractAddress:
                  _context.merkleDistributorContractAddresses?.[index],
                distributionEnd,
                ..._context.merkleTrees?.[originalIndex],
              },
            }

            allocationJSONs.push(allocationData)
          })
        }

        const linearVestings = distributionData?.filter(
          (allocation) => allocation.vestingType === "LINEAR_VESTING"
        )

        if (linearVestings?.length && _context.merkleVestingContractAddress) {
          const allocationData: AllocationJSON = {
            vestingType: "LINEAR_VESTING",
            name: "Vesting",
            createdBy: accountData?.address,
            createdAt: currentDateInSeconds,
            merkleVesting: {
              contractAddress: _context.merkleVestingContractAddress,
              cohorts: [],
            },
          }

          // Populating the "cohorts" field
          linearVestings.forEach((vesting) => {
            const originalIndex = distributionData.findIndex(
              (allocation) =>
                allocation.allocationName.toLowerCase() ===
                vesting.allocationName.toLowerCase()
            )

            const distributionDurationInSeconds = monthsToSecond(
              vesting.distributionDuration
            )
            const cliffPeriod = monthsToSecond(vesting.cliff)
            const vestingPeriod = monthsToSecond(vesting.vestingPeriod)
            const distributionEnd = Math.round(
              currentDateInSeconds + distributionDurationInSeconds
            )

            allocationData.merkleVesting.cohorts.push({
              name: vesting.allocationName,
              cliffPeriod,
              vestingPeriod,
              distributionEnd,
              ..._context.merkleTrees?.[originalIndex],
            })
          })

          allocationJSONs.push(allocationData)
        }

        allocationJSONs.forEach((json, index) => {
          const fileName = `allocation${index}.json`
          ipfsData.append(fileName, JSON.stringify(json))

          const metadataAttribute =
            json.vestingType === "NO_VESTING"
              ? "airdrops"
              : json.vestingType === "LINEAR_VESTING"
              ? "vestings"
              : null

          if (metadataAttribute) {
            info[metadataAttribute].push({
              fileName,
              prettyUrl: slugify(json.name),
            })
          }
        })

        if (icon) {
          ipfsData.append("icon", icon, `icon.${icon.name.split(".").pop()}`)
          info.icon = `icon.${icon.name.split(".").pop()}`
        }

        ipfsData.append("info.json", JSON.stringify(info))

        return fetch("/api/upload-to-ipfs", { method: "POST", body: ipfsData })
      },
    },
  })

  useWarnIfUnsavedChanges(!state?.matches("idle"))

  // DEBUG
  useEffect(() => {
    if (process.env.NODE_ENV === "development") console.log("MACHINE STATE", state)
  }, [state])

  const startDeploy = () => send("DEPLOY")

  const isLoading = useMemo(
    () =>
      !state.matches("idle") &&
      !state.matches("finished") &&
      !state.matches("error"),
    [state]
  )

  const loadingText = useMemo(() => {
    if (state.matches("testing")) return "Pre-deployment test"
    else if (state.matches("deploying")) return "Creating token"
    else if (state.matches("sendingTokensWithDisperse")) return "Distributing tokens"
    else if (state.matches("creatingMerkleContracts")) return "Deploying contracts"
    else if (state.matches("creatingCohorts")) return "Creating cohorts"
    else if (state.matches("fundingContracts"))
      return "Funding airdrop/vesting contracts"
    else if (state.matches("ipfs")) return "Uploading data to IPFS"
    else return "Loading"
  }, [state])

  const finished = useMemo(() => state.matches("finished"), [state])

  return { startDeploy, isLoading, loadingText, finished }
}

export default useDeploy
