import { SimpleGrid, Stack } from "@chakra-ui/react"
import AddCard from "components/common/AddCard"
import { useFieldArray } from "react-hook-form"
import AllocationFormCard from "./components/AllocationFormCard"

const DistributionForm = (): JSX.Element => {
  const { fields, append, remove } = useFieldArray({ name: "distributionData" })

  return (
    <Stack spacing={8} w="full">
      {fields.map((field, index) => (
        <AllocationFormCard
          key={field.id}
          index={index}
          field={field}
          onRemove={() => remove(index)}
        />
      ))}

      <SimpleGrid gridTemplateColumns="repeat(3, 1fr)" gap={4}>
        <AddCard text="Claiming" onClick={() => append({})} />
        <AddCard text="Distribution" onClick={() => append({})} />
      </SimpleGrid>
    </Stack>
  )
}

export default DistributionForm