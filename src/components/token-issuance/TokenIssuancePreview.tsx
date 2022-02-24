import { Tag, Text, VStack } from "@chakra-ui/react"
import { useFormContext, useWatch } from "react-hook-form"
import { TokenIssuanceFormType } from "types"
import shortenHex from "utils/shortenHex"
import { useAccount } from "wagmi"

const TokenIssuancePreview = (): JSX.Element => {
  const [{ data: accountData }] = useAccount()
  const { control } = useFormContext<TokenIssuanceFormType>()

  const tokenTicker = useWatch({ control, name: "tokenTicker" })
  const inflationaryModel = useWatch({ control, name: "inflationaryModel" })
  const initialSupply = useWatch({ control, name: "initialSupply" })
  const transferOwnershipTo = useWatch({ control, name: "transferOwnershipTo" })
  const chain = useWatch({ control, name: "chain" })

  if (!tokenTicker && !initialSupply) return null

  return (
    <VStack alignItems="start" spacing={1} fontSize="sm">
      <Text as="span" fontWeight="bold">
        {tokenTicker ? `$${tokenTicker} token` : "No ticker"}
      </Text>
      <Tag size="sm">
        Supply:{" "}
        {inflationaryModel === "UNLIMITED"
          ? "unlimited"
          : !isNaN(initialSupply) && Number(initialSupply).toLocaleString("en")}
      </Tag>
      <Tag size="sm">
        Owner: {shortenHex(transferOwnershipTo || accountData?.address, 3)}
      </Tag>
      <Tag size="sm">Chain: {chain}</Tag>
    </VStack>
  )
}

export default TokenIssuancePreview
