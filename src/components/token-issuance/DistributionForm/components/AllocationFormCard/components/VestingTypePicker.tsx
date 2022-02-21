import { StackDivider, useColorMode, useRadioGroup, VStack } from "@chakra-ui/react"
import { useController, useFormContext } from "react-hook-form"
import LinearVestingForm from "./LinearVestingForm"
import VestingTypeOption from "./VestingTypeOption"

type Props = {
  index: number
}

const OPTIONS: Array<{
  value: string
  title: string
  disabled: boolean | string
  children?: (props: any) => JSX.Element
}> = [
  {
    value: "NO_VESTING",
    title: "No vesting",
    disabled: false,
  },
  {
    value: "LINEAR_VESTING",
    title: "Linear vesting",
    disabled: false,
    children: LinearVestingForm,
  },
  {
    value: "BOND_VESTING",
    title: "Bond vesting",
    disabled: "Coming soon",
  },
]

const VestingTypePicker = ({ index }: Props): JSX.Element => {
  const { control } = useFormContext()

  const { field } = useController({
    control,
    name: `distributionData.${index}.vestingType`,
    rules: { required: "You must pick a realm for your guild" },
  })

  const { getRootProps, getRadioProps } = useRadioGroup({
    name: `distributionData.${index}.vestingType`,
    onChange: field.onChange,
    value: field.value,
    defaultValue: "NO_VESTING",
  })

  const group = getRootProps()
  const { colorMode } = useColorMode()

  return (
    <VStack
      {...group}
      borderRadius="xl"
      bg={colorMode === "light" ? "white" : "blackAlpha.300"}
      spacing="0"
      border="1px"
      borderColor={colorMode === "light" ? "blackAlpha.300" : "whiteAlpha.300"}
      divider={<StackDivider />}
    >
      {OPTIONS.map((option) => {
        const radio = getRadioProps({ value: option.value })
        return (
          <VestingTypeOption key={option.value} {...radio} {...option}>
            {option.children && <option.children index={index} />}
          </VestingTypeOption>
        )
      })}
    </VStack>
  )
}

export default VestingTypePicker