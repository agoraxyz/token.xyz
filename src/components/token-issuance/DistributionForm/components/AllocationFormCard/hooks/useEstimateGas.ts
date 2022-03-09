import { ethers } from "ethers"
import { useFormContext, useWatch } from "react-hook-form"
import { TokenIssuanceFormType, VestingTypes } from "types"
import { useFeeData } from "wagmi"

const AVG_CONTRACT_DEPLOYMENT_FEES: Record<VestingTypes, string> = {
  NO_VESTING: "690819",
  LINEAR_VESTING: "1255685",
  BOND_VESTING: "0",
}

const AVG_ADD_COHORT_FEE = 92492

const useEstimateGas = (formIndex: number) => {
  const [{ data: feeData, error, loading }] = useFeeData({ formatUnits: "ether" })

  const { control } = useFormContext<TokenIssuanceFormType>()

  const distributionData = useWatch({ control, name: "distributionData" })
  const vestingType = useWatch({
    control,
    name: `distributionData.${formIndex}.vestingType`,
  })

  const gasFee = feeData?.gasPrice?.toNumber() || 0

  const estimatedFee = (
    vestingType === "LINEAR_VESTING" &&
    distributionData?.filter(
      (allocation) => allocation.vestingType === "LINEAR_VESTING"
    )?.length > 1 &&
    distributionData?.find(
      (allocation) => allocation.vestingType === "LINEAR_VESTING"
    )?.allocationAddressesAmounts !==
      distributionData?.[formIndex]?.allocationAddressesAmounts
      ? // If the current allocation form type is "LINEAR_VESTING", and it's not the first "LINEAR_VESTING" form type in the fieldArray, then only calculate the gas fee for the "addCohort" call.
        parseFloat(ethers.utils.formatEther(AVG_ADD_COHORT_FEE)) * gasFee
      : (parseFloat(
          ethers.utils.formatEther(AVG_CONTRACT_DEPLOYMENT_FEES[vestingType] || 0)
        ) +
          parseFloat(
            ethers.utils.formatEther(
              vestingType === "LINEAR_VESTING" ? AVG_ADD_COHORT_FEE : 0
            )
          )) *
        gasFee
  )?.toFixed(5)

  return {
    loading,
    error,
    estimatedFee,
  }
}

export default useEstimateGas
